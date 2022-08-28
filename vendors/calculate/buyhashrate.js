function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function decimalPlaces(num) {
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function bindValues(slider, input, initialcost, dailyfee, expectedBtcRevenue, expectedUsdRevenue, minThs, maxThs, nonDiscountedPrice, costPerThs, discounts) {
	
	// When user releases slider
	slider.noUiSlider.on('change', function(values, handle) {
		input.value = values[handle];
		
		// Prevent selecting below minimum hashrate
		if ( parseInt(input.value.substring(0, input.value.length - 3).replace(/,/g, '')) < minThs ) {
			slider.noUiSlider.set(minThs + " TH/s");
			input.value = minThs + " TH/s";
		// Prevent selecting above maximum hashrate. If max hashrate is 0, then don't enforce this rule
		} else if ( (parseInt(input.value.substring(0, input.value.length - 3).replace(/,/g, '')) > maxThs) && maxThs != 0 ) {
			slider.noUiSlider.set(maxThs + " TH/s");
			input.value = maxThs + " TH/s";
		}
	});
	
	// When user drags slider
	slider.noUiSlider.on('update', function(values, handle) {
		input.value = values[handle];
		var terahashes = parseInt(input.value.substring(0, input.value.length - 3).replace(/,/g, ''));
		
		// Set price without bulk discount
		initialcost.setAttribute("data-initialcost", nonDiscountedPrice);
		costPerThs.innerHTML = '$' + nonDiscountedPrice + ' per TH/s';
		
		// Apply bulk discounts if applicable
		$.each(discounts, function(key, value) {
			if ( terahashes >= discounts[key].ths ) {
				// don't override lower discounts
				if (initialcost.getAttribute("data-initialcost") > discounts[key].cost) {
					initialcost.setAttribute("data-initialcost", discounts[key].cost);
					costPerThs.innerHTML = '$' + discounts[key].cost + ' per TH/s';
				}
			}
		});
		
		var costPerTerahash = parseInt(initialcost.getAttribute("data-initialcost"));
		var feePerTerahash = Number(dailyfee.getAttribute("data-dailyfee"));
		
		if (expectedBtcRevenue != undefined) {
      var btcPerThs = Number(expectedBtcRevenue.getAttribute("data-btcperths"));
      var usdPerThs = Number(expectedUsdRevenue.getAttribute("data-usdperths"));
      
      expectedBtcRevenue.innerHTML = parseFloat((btcPerThs * terahashes).toFixed(8));
      expectedUsdRevenue.innerHTML = numberWithCommas((usdPerThs * terahashes).toFixed(2));
		}
		
		initialcost.innerHTML = numberWithCommas(costPerTerahash * terahashes);
		dailyfee.innerHTML = numberWithCommas((feePerTerahash * terahashes).toFixed(2));
		
		if(decimalPlaces((feePerTerahash * terahashes).toString()) == 0) {
			dailyfee.innerHTML = (feePerTerahash * terahashes).toFixed(0).toString();
		}
		
	});
	
	// When user types in hashrate
	input.addEventListener('change', function() {
		//Remove all non-numeric characters and append "TH/s" at the end
		this.value = this.value.replace(/\D/g,'') + " TH/s";
		if (this.value == " TH/s"){
			slider.noUiSlider.set(minThs + " TH/s");
			this.value = minThs + " TH/s";
		}
		// Prevent selecting below minimum hashrate
		if ( parseInt(this.value.substring(0, this.value.length - 3).replace(/,/g, '')) < minThs ) {
			slider.noUiSlider.set(minThs + " TH/s");
			this.value = minThs + " TH/s";
		// Prevent selecting above maximum hashrate. If max hashrate is 0, then don't enforce this rule.
		} else if ( (parseInt(input.value.substring(0, input.value.length - 3).replace(/,/g, '')) > maxThs) && maxThs != 0 ) {
			slider.noUiSlider.set(maxThs + " TH/s");
			this.value = maxThs + " TH/s";
		}
		
		var costPerTerahash = parseInt(initialcost.getAttribute("data-initialcost"));
		var feePerTerahash = Number(dailyfee.getAttribute("data-dailyfee"));
		var terahashes = parseInt(this.value.substring(0, this.value.length - 3).replace(/,/g, ''));
		
		if (expectedBtcRevenue != undefined) {
      var btcPerThs = Number(expectedBtcRevenue.getAttribute("data-btcperths"));
      var usdPerThs = Number(expectedUsdRevenue.getAttribute("data-usdperths"));
      
      expectedBtcRevenue.innerHTML = parseFloat((btcPerThs * terahashes).toFixed(8));
      expectedUsdRevenue.innerHTML = numberWithCommas((usdPerThs * terahashes).toFixed(2));
		}
		
		initialcost.innerHTML = numberWithCommas(costPerTerahash * terahashes);
		dailyfee.innerHTML = numberWithCommas((feePerTerahash * terahashes).toFixed(2));
		
		if(decimalPlaces((feePerTerahash * terahashes).toString()) == 0) {
			dailyfee.innerHTML = (feePerTerahash * terahashes).toFixed(0).toString();
		}
	});
}

$(document).ready(function() {
	
	$.ajax({
        url: "https://console.pool.bitcoin.com/srv/getcontracts",
        type: "GET",
        cache: false,
        data: { },
        statusCode: {
                200: function (response) {
				
				$.each(response, function(index, value){
					var htmlContent = `<div class="col-lg-6 col-md-6 col-sm-6">
							<div class="panel panel-body" style="padding:0px;">
								<ul class="price" style="width:100%;">
								    <li class="header" style="padding: 15px;">
								    	#{contract.name}
									</li>
								    <li class="grey" style="padding-bottom:10px;">
								    	<div class="row">
								    		<div class="col-xs-6"><div style="font-size:30px">$<span class="initial-cost" data-initialcost="#{contract.initialCost}">#{contract.initialCost}</span></div> Initial Cost</div>
								    		<div class="col-xs-6"><div style="font-size:30px">$<span class="daily-fee" data-dailyfee="#{contract.dailyFee}">#{contract.dailyFee}</span></div> Daily Fee <span class="helptooltip" data-tooltip-content="#fee_tooltip_content" style="border-bottom: 1px dashed #fff; text-decoration: none;"><i class="fa fa-question-circle"></i></span></div>
											
											<!-- Invisible spans just for storing contract data -->
								    		<span class="min-ths" style="display:none;">#{contract.minPurchaseThs}</span>
								    		<span class="max-ths" style="display:none;">#{contract.stockRemaining}</span>
								    		<span class="non-discounted-price" style="display:none;">#{contract.initialCost}</span>
								    		<span class="discounts" style="display:none;">#{contract.discountsJson}</span>
								    	</div>
										<div class="row" style="padding-top:10px;">
											<div class="cost-per-ths" style="font-size:24px;">$#{contract.initialCost} per TH/s</div>
										</div>
								    </li>
								    <li class="grey" style="padding-top:10px;">
						    			<div style="border-bottom: 2px dotted #F9B016; display: inline;">
						    				<input type="text" class="hashrate-input" value="1 TH/s" style="max-width:220px; text-align: center; font-size:40px; color: #F9B016; background-color:rgba(0,0,0,0) !important; border:none !important; box-shadow:none !important;" />
						    			</div>
						    			<div style="font-size:25px; min-height:72px;">for #{contract.contractLengthString}</div>
								    	<div class="hashrate-slider"></div>
								    </li>
								    <li class="grey" style="padding-top:10px;">
								    	<div>Current Daily Returns <span class="helptooltip" data-tooltip-content="#returns_tooltip_content" style="border-bottom: 1px dashed #fff; text-decoration: none;"><i class="fa fa-question-circle"></i></span></div>
								    	<div><span class="expected-btc-revenue" data-btcperths="#{buycontracts.btcPerThs}">0.000 00 01</span> BTC ($<span class="expected-usd-revenue" data-usdperths="#{buycontracts.usdPerThs}">123</span>) per day</div>
								    </li>
								    <li>#{contract.minPurchaseString} Minimum Purchase<br />#{contract.stockRemainingString} Stock Remaining</li>
								    <li>#{contract.paymentOptionsString} accepted</li>
								    
                                	<li class="grey"><button class="buybtn button w3-hover-green dropdown-toggle" data-contractid="#{contract.contractId}">Buy</button></li>
								    
								</ul>
							</div>
						</div>`;
						
						if(value.preOrderStartDate != null) {
              var preOrderStartDate = new Date(value.preOrderStartDate);
              
              htmlContent = htmlContent.replace('Current Daily Returns <span class="helptooltip" data-tooltip-content="#returns_tooltip_content" style="border-bottom: 1px dashed #fff; text-decoration: none;"><i class="fa fa-question-circle"></i></span>', "Pre-Order Delivery Date");
              htmlContent = htmlContent.replace('<span class="expected-btc-revenue" data-btcperths="#{buycontracts.btcPerThs}">0.000 00 01</span> BTC ($<span class="expected-usd-revenue" data-usdperths="#{buycontracts.usdPerThs}">123</span>) per day', preOrderStartDate.getFullYear() + "-" + (preOrderStartDate.getMonth()+1) + "-" + preOrderStartDate.getDate());
						}
						
						htmlContent = htmlContent.replace(/#{contract.name}/g, value.name);
						htmlContent = htmlContent.replace(/#{contract.initialCost}/g, value.initialCost);
						htmlContent = htmlContent.replace(/#{contract.dailyFee}/g, value.dailyFee);
						htmlContent = htmlContent.replace(/#{contract.minPurchaseThs}/g, value.relativeHashrateMinPurchase);
						htmlContent = htmlContent.replace(/#{contract.stockRemaining}/g, value.relativeHashrateStockRemaining);
						htmlContent = htmlContent.replace(/#{contract.contractLengthString}/g, value.contractLengthString);
						htmlContent = htmlContent.replace(/#{buycontracts.btcPerThs}/g, value.coinPerHashrate);
						htmlContent = htmlContent.replace(/#{buycontracts.usdPerThs}/g, value.usdPerHashrate);
						htmlContent = htmlContent.replace(/#{contract.minPurchaseString}/g, value.minPurchaseString);
						htmlContent = htmlContent.replace(/#{contract.stockRemainingString}/g, value.stockRemainingString);
						htmlContent = htmlContent.replace(/#{contract.paymentOptionsString}/g, value.paymentOptionsString);
						htmlContent = htmlContent.replace(/#{contract.contractId}/g, value.contractId);
						htmlContent = htmlContent.replace(/#{contract.discountsJson}/g, value.discountsJson);
						
						if (value.stockRemainingString == '0 h/s') {
							htmlContent = htmlContent.replace('<button class="buybtn button w3-hover-green dropdown-toggle" data-contractid="' + value.contractId + '">Buy</button>', '<div style="color:red; padding-top:14px; padding-bottom:14px;">Out of stock</div><div><a href="http://eepurl.com/cPQ2m9" class="btn btn-lg btn-warning" role="button">Join Waiting List</a></div');
						}
						
					$("#contracts").append(htmlContent);
				});

                },
                500: function (response) {

                }
              },
              complete: function(e, xhr, settings){
				    var sliders = document.getElementsByClassName('hashrate-slider');
					var inputs = document.getElementsByClassName('hashrate-input');
					
					var initialcosts = document.getElementsByClassName('initial-cost');
					var dailyfees = document.getElementsByClassName('daily-fee');
					
					var minths = document.getElementsByClassName('min-ths');
					var maxths = document.getElementsByClassName('max-ths');
					
					var expectedBtcRevenues = document.getElementsByClassName('expected-btc-revenue')
					var expectedUsdRevenues = document.getElementsByClassName('expected-usd-revenue');
					
					var nonDiscountedPrice = document.getElementsByClassName('non-discounted-price');
					var costPerThs = document.getElementsByClassName('cost-per-ths');
					var discounts = document.getElementsByClassName('discounts');
					
					for ( var i = 0; i < sliders.length; i++ ) {
						var thisSlider = sliders[i];
						var thisInput = inputs[i];
						
						noUiSlider.create(thisSlider, {
							connect: 'lower',
							start: [ 5 ],
							step: 1,
							range: {
								'min': [ 1 ],
								'25%': [ 10, 5 ],
								'50%': [ 100, 50 ],
								'75%': [ 1000, 500 ],
                '82%': [ 5000, 1000 ],
                'max': [ 15000 ]
							},
							format: wNumb({
								decimals: 0,
								thousand: ',',
								postfix: ' TH/s',
							})
						});
						
						bindValues(sliders[i], inputs[i], initialcosts[i], dailyfees[i], expectedBtcRevenues[i], expectedUsdRevenues[i], minths[i].innerHTML, maxths[i].innerHTML, nonDiscountedPrice[i].innerHTML, costPerThs[i], JSON.parse(discounts[i].innerHTML));

					}
					
					$(".buybtn").click(function(e){
						e.preventDefault(); //prevent hash in URL
						
						var contractId = $(this).attr("data-contractId");
						var ths = $(this).closest('.grey').siblings('.grey').find('.hashrate-input').val().slice(0,-5);
						
						var code = getURLParameter('code');
            
            if (code == null) {
                code = "";
            } else {
                code = "&code=" + code;
            }
						
            window.top.location.href = "https://console.pool.bitcoin.com/confirmorderguest?contractid=" + contractId + "&hashrate=" + ths + "&language=en" + code;
					});
					
					$('.helptooltip').tooltipster({
						contentCloning: true,
						animation: 'fade',
						delay: 10,
						trigger: 'click',
						maxWidth: 400,
						interactive: true
					});
					
					$(".col-sm-6:eq(1)").prepend('<div class="ribbon ribbon-top-right"><span>POPULAR!</span></div>');
        }
    });
    
});