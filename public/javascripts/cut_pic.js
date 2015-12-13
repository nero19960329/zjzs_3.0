var Resizer = $(
	'<div class="div-resizer">' +
	'<div class="div-inner">' +
	'<img>' +
	'<div class="div-frames_container"><div class="div-frames"></div></div>' +
	'</div>' +
	'<button class="btn btn-default" id="btn-resizer_ok" type="button" style="display: none; margin-top: 10px;">裁剪</button>' +
	'</div>'
);

$.imageResizer = function() {
	// 如果不支持以下组件，返回false
	if (!Uint8Array && HTMLCanvasElement && atob && Blob) {
		return false;
	}

	var resizer = Resizer.clone();
	resizer.image = resizer.find('img')[0];
	resizer.frames = resizer.find('.div-frames');
	resizer.okButton = resizer.find('#btn-resizer_ok');
	resizer.frames.offset = {
		top: 0,
		left: 0
	};

	resizer.okButton.click(function() {
		resizer.clipImage();
	});

	setOnResize();
	setTouch();

	resizer.clipImage = function() {
		var naturalHeight = this.image.naturalHeight;
		var naturalWidth = this.image.naturalWidth;
		var size;

		if (naturalHeight * 2 < naturalWidth) {
			size = naturalHeight;
		} else {
			size = naturalWidth / 2;
		}

		if (size > 200) {
			size = 200;
		}

		var canvas = $(
			'<canvas width="' + (size * 2) + '" ' +
			'height="' + size + '"></canvas>'
		)[0];
		var ctx = canvas.getContext('2d');
		var scale = naturalWidth / this.offset.width;
		var x = this.frames.offset.left * scale;
		var y = this.frames.offset.top * scale;
		var w = this.frames.offset.size * 2 * scale;
		var h = this.frames.offset.size * scale;
		ctx.drawImage(this.image, x, y, w, h, 0, 0, size*2, size);

		var src = canvas.toDataURL();
		debugger;
		this.canvas = canvas;
		this.append(canvas);
		this.addClass('uploading');
		this.removeClass('have-img');

		src = src.split(',')[1];
		if (!src) {
			return this.doneCallback(null);
		}
		src = window.atob(src);

		var ia = new Uint8Array(src.length);
		for (var i = 0; i < src.length; ++i) {
			ia[i] = src.charCodeAt(i);
		}

		debugger;
		this.doneCallback(new Blob([ia], {
			type: "image/jpeg"
		}));
		this.okButton.css('display', 'none');
	};

	resizer.resize = function(file, done) {
		this.reset();
		this.doneCallback = done;
		this.setFrameSize(0);
		this.frames.css({
			top: 0,
			left: 0
		});

		var reader = new FileReader();
		reader.onload = function() {
			resizer.image.src = reader.result;
			reader = null;
			resizer.addClass('have-img');

			// 不设置异步就会导致modifyImgSize方法中获得的naturalWidth以及naturalHeight可能为0
			// 为避免此玄学的结果，采用更加无脑的方式解决，即等一会儿..
			// 后人可专心研究一下，用一个漂亮的方法fix掉这个问题
			setTimeout(function() {
				modifyImgSize(resizer);
				resizer.setFrames();
			}, 200);
		};
		reader.readAsDataURL(file);
	};

	resizer.reset = function() {
		this.image.src = "";
		this.removeClass('have-img');
		this.removeClass('uploading');
		this.find('canvas').detach();
	};

	resizer.setFrameSize = function(size) {
		this.frames.offset.size = size;
		return this.frames.css({
			width: size*2 + 'px',
			height: size + 'px'
		});
	};

	resizer.getDefaultSize = function() {
		//var width = this.find(".div-inner").width();
		//var height = this.find(".div-inner").height();
		var width = this.image.width;
		var height = this.height.height;
		this.offset = {
			width: width,
			height: height
		};

		if (width > height*2) {
			return height;
		} else {
			return width/2;
		}
	};

	resizer.moveFrames = function(offset) {
		var x = offset.x;
		var y = offset.y;
		var top = this.frames.offset.top;
		var left = this.frames.offset.left;
		var size = this.frames.offset.size;
		//var width = this.offset.width;
		//var height = this.offset.height;
		var width = this.image.width;
		var height = this.image.height;

		if (x+size*2+left > width) {
			x = width-size*2;
		} else {
			x += left;
		}

		if (y+size+top > height) {
			y = height-size;
		} else {
			y += top;
		}

		x = x < 0 ? 0 : x;
		y = y < 0 ? 0 : y;

		this.frames.css({
			top: y + 'px',
			left: x + 'px'
		});

		this.frames.offset.top = y;
		this.frames.offset.left = x;
	};

	resizer.setFrames = function() {
		var size = resizer.getDefaultSize();
		resizer.setFrameSize(size);
	};

	function modifyImgSize(resizer) {
		var naturalWidth = resizer.image.naturalWidth;
		var naturalHeight = resizer.image.naturalHeight;
		var containerWidth = $('.div-resize_container').width();
		var containerHeight = $('.div-resize_container').height();
		var newWidth, newHeight;
		if (naturalWidth/naturalHeight < containerWidth/containerHeight) {
			newWidth = containerHeight*naturalWidth/naturalHeight;
			newHeight = containerHeight;
			resizer.find('.div-inner img').width(newWidth);
			resizer.find('.div-inner img').height(newHeight);
			resizer.find('.div-frames_container').width(newWidth);
			resizer.find('.div-frames_container').height(newHeight);
		} else {
			newWidth = containerWidth;
			newHeight = containerWidth*naturalHeight/naturalWidth;
			resizer.find('.div-inner img').width(newWidth);
			resizer.find('.div-inner img').height(newHeight);
			resizer.find('.div-frames_container').width(newWidth);
			resizer.find('.div-frames_container').height(newHeight);
		}
	}

	function setOnResize() {
		var time;

		window.onresize = function() {
			clearTimeout(time);
			time = setTimeout(this.setFrames, 1000);
		};
	}

	function setTouch() {
		var lastPoint = null;
		function getOffset(event) {
			event = event.originalEvent;
			var x, y;
			if (event.touches) {
				var touch = event.touches[0];
				x = touch.clientX;
				y = touch.clientY;
			} else {
				x = event.clientX;
				y = event.clientY;
			}

			if (!lastPoint) {
				lastPoint = {
					x: x,
					y: y
				};
			}

			var offset = {
				x: x-lastPoint.x,
				y: y-lastPoint.y
			};

			lastPoint = {
				x: x,
				y: y
			};

			return offset;
		}

		resizer.frames.on('touchstart mousedown', function(event) {
            getOffset(event);
        });
        resizer.frames.on('touchmove mousemove', function(event) {
            if(!lastPoint) return;
            var offset = getOffset(event);
            resizer.moveFrames(offset);
        });
        $(window).mouseup(function(event) {
        	lastPoint = null;
        });
        resizer.frames.on('touchend mouseup', function(event) {
            lastPoint = null;
        });
	}

	return resizer;
};
