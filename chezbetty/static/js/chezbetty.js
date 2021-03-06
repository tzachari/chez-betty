/*
 * Chez Betty Main Javascript
 *
 */


/* Functions to manipulate price strings and numbers.
 */
function format_price (price) {
	p = price.toFixed(2);

	if (p < 0) {
		return '<span class="negative">-$' + (p*-1.0).toFixed(2) + '</span>';
	} else {
		return '<span class="positive">$' + p + '</span>';
	}
}

function strip_price (price_str) {
	return price_str.replace(/^\s+|\s+$|\$/g, '');
}

function full_strip_price (price_str) {
	return price_str.replace(/^\s+|\s+$|\.|\$/g, '');
}

/* Functions to display and hide alerts at the top of the page
 */

function alert_clear () {
	$("#alerts").empty();
}

function alert_error (error_str) {
	html = '<div class="alert alert-danger" role="alert">'+error_str+'</div>';
	$("#alerts").empty();
	$("#alerts").html(html);
}

function enable_button (button) {
	button.removeAttr("disabled");
}

function disable_button (button) {
	button.attr("disabled", "disabled");
}

// Callback when adding an item to the cart succeeds
function add_item_success (data) {
	alert_clear();

	// Check if there was an error looking up the product
	if (data.status == "disabled") {
		alert_error("That product is not currently for sale.");
	} else if (data.status == "unknown_barcode") {
		alert_error("Could not find that item.");
	} else {

		// First, if this is the first item hide the empty order row
		$("#purchase-empty").hide();

		// Check if this item is already present. In that case we only
		// need to increment the quantity and price
		if ($("#purchase-item-" + data.id).length) {
			item_row = $("#purchase-item-" + data.id);

			// Increment the quantity
			quantity = parseInt(item_row.find(".item-quantity span").text()) + 1;
			item_price = parseFloat(item_row.children(".item-price-single").text());

			item_row.find(".item-quantity span").text(quantity);
			item_row.children(".item-total").html(format_price(quantity*item_price));

			if (quantity >= 2) {
				item_row.find("td .btn-decrement-item").show();
			}

		} else {
			// Add a new item
			$("#purchase_table tbody").append(data.item_row_html);
		}

		calculate_total();

	}
}

// Callback when adding to cart fails.
function add_item_fail () {
	alert_error("Could not find that item.");
}

// Callback when a purchase was successful
function purchase_success (data) {
	if ("error" in data) {
		alert_error(data.error);
		enable_button($("#btn-submit-purchase"));
	} else if ("redirect_url" in data) {
		window.location.replace(data.redirect_url);
	} else {
		// On successful purchase, redirect the user to the transaction complete
		// page showing the transaction.
		window.location.replace("/event/" + data.event_id);
	}
}

// Callback when a purchase fails for some reason
function purchase_error () {
	alert_error("Failed to complete purchase. Perhaps try again?");
	enable_button($("#btn-submit-purchase"));
}

// Callback when a deposit POST was successful
function deposit_success (data) {
	if ("error" in data) {
		alert_error(data.error);
		enable_button($("#btn-submit-deposit"));
		$("#keypad-total").html(format_price(0.0));
	} else if ("redirect_url" in data) {
		window.location.replace(data.redirect_url);
	} else {
		// On successful deposit, redirect the user to the transaction complete
		// page showing the transaction.
		window.location.replace("/event/" + data.event_id);
	}
}

// Callback when a deposit fails for some reason
function deposit_error () {
	alert_error("Failed to complete deposit. Perhaps try again?");
	enable_button($("#btn-submit-deposit"));
	$("#keypad-total").html(format_price(0.0));
}

// Function called by chezbetty-item.js when a new item was scanned and
// should be added to the cart.
function add_item (item_id) {
	$.ajax({
		dataType: "json",
		url: "/item/"+item_id+"/json",
		success: add_item_success,
		error: add_item_fail
	});
}

// Function to add up the items in a cart to display the total.
function calculate_total () {
	total = 0;
	$("#purchase_table tbody tr:visible").each(function (index) {
		if ($(this).attr('id') != "purchase-empty") {
			line_total = parseFloat(
				strip_price($(this).children('.item-total').text()));
			total += line_total;
		}
	});

	$("#purchase-total").html(format_price(total));
}
