function about(){
	var width = $(window).innerWidth(),
		height = $(window).innerHeight();
	const imgheight = 80;

	var container = imgheight*height/100,
		footer = 45*height/100;

	$(".container").css('height', ' ' + (container) + 'px ');


	$(".footer").css('height', ' ' + (height + (container-footer)) + 'px ');
}



$(document).ready(function(e) {
	about();
	window.addEventListener('resize', function() {
		about();
	});
})