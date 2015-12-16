$(document).ready(function()
{
	var resizer = $.imageResizer();
	var resizedImage;
	if (!resizer) {
		resizer = $(
			"<p>Your browser doesn't support these feature:</p>" +
			"<ul><li>canvas</li><li>Blob</li><li>Uint8Array</li><li>FormData</li><li>atob</li></ul>"
		);
	}
	$('.div-resize_container').append(resizer);
	$('#upfile').change(function(event) {
        if (this.files.length != 0) {
            resizer.okButton.css('display', 'block');
        } else {
            resizer.okButton.css('display', 'none');
        }
		var file = this.files[0];
		resizer.resize(file, function(file) {
			resizedImage = file;
		});
	});
    $('#fileUploader').submit(function() {
		if (resizer.okButton.css('display') != 'none') {
			setPopOver(resizer.okButton, "请您先裁剪图片");
			setTimeout(function() {
				resizer.okButton.popover('destroy');
			}, 1000);
			return false;
		}

        var options = {
            dataType: 'json',
			beforeSubmit: function(formData, jqForm, options) {
				formData.push({
                    name: 'blob',
                    required: false,
                    value: resizedImage
                });
			},
            success: successRes,
            error: errorRes
        };
        $(this).ajaxSubmit(options);
        return false;
    });
    hideUploader();
    $("#alphaCover").click(hideUploader);
    $("#input-uploadPic").click(showUploader);
});

function hideUploader()
{
    $("#globalCover").css("visibility","hidden");
    $("#alphaCover").css("opacity","0");
    $("#windowCover").css("top","-100px");
}

function showUploader()
{
    $("#globalCover").css("visibility","visible");
    $("#alphaCover").css("opacity","0.3");
    $("#windowCover").css("top","10%");
    $("#errCosntent").text("");
}

function beforeSubmitResized(formData, jqForm, options) {
	/*formData.push({
		name: 'image',
		required: false,
		type: 'file',
		value: resizedImage
	});*/
	debugger;
	formData.append('file', resizedFile);
}

function errorRes(data)
{
    if (data && data.status==200)
    {
        successRes(data);
        return;
    }
    $("#windowCover").removeClass("shadowBlue").addClass("shadowRed");
    setTimeout(function()
    {
        $("#windowCover").removeClass("shadowRed").addClass("shadowBlue");
    },1000);
    if (data instanceof String)
    {
        $("#errCosntent").text(data);
    }
    else
    {
        $("#errCosntent").text("上传失败，请重试。");
    }
}

function successRes(data)
{
    debugger;
    if (data.responseText=="Nothing")
    {
        errorRes();
        return;
    }
    $("#input-pic_url")[0].value=changeURL(data.responseText);
    hideUploader();
}

// 修改url的斜杠
function changeURL(text) {
    return text.replace(/\\/g, '/');
}
