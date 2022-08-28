$("#calculatebtn").click(function() {
	var calculatebtn = $(this);
	calculatebtn.addClass('spinload');
	
	var hashrate = $("#hashrateInput").val();
	var unit = $('#selectUnit').val();;
	
    $.ajax({
    	url: "https://console.pool.bitcoin.com/srv/revenuecalculator",
    	xhrFields: {
            withCredentials: true
        },
    	type: "GET",
    	cache: false,
        data: {hashrate:hashrate, unit:unit},
	    statusCode: {
            200: function (response) {
            	console.log(response);
            	$('#calculation').text(response.message);
            }
          },
          complete: function(e, xhr, settings){
        	  calculatebtn.removeClass('spinload');
          }
    });
});