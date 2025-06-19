function shop(){
	var width = $(window).innerWidth(),
		height = $(window).innerHeight();

	gsap.defaults({ease: "none", duration: 2});

	var container = $(".container").height();

	$("#container").css('height', ' ' + (container + 100) + 'px ');
	$("#footer").css('height', ' ' + (container + 100 + height*.55) + 'px ');


	gsap.to(".navigation", {
		scrollTrigger: {
			trigger: ".container",
			start: "top bottom",
			end: "bottom center",
			markers: false,
			toggleClass: {
				targets: ".navigation",
				className: "lg-at-small",
			}
		},
	});

	$(".navigation .custom-fragment").hover(function() {
		if ($(".navigation").hasClass("lg-at-small")) {
			$(".navigation").addClass("hover-to-big")
		}
	}, function() {
		if ($(".navigation").hasClass("lg-at-small")) {
			$(".navigation").removeClass("hover-to-big")
		}
		$(".navigation").removeClass("hover-to-big")
	})
}

function polygon() {
	const root = document.querySelector(':root');

	var w = $(window).innerWidth(),
		h = $(window).innerHeight(),
		sr = $(window).scrollTop(),
		b = 50;

	var	ctn = $("#container").offset().top - sr,
		ctnheight = ctn + $("#container").height();

	var tl = "0px ".concat(ctn, "px"),
		tr = "".concat(w, "px ").concat(ctn, "px"),
		br = "".concat(w, "px ").concat(ctnheight, "px"),
		bl = "0px ".concat(ctnheight, "px");

	var polygon = "".concat(tl, ", ").concat(tr, ", ").concat(br, ", ").concat(bl);
	document.documentElement.style.setProperty("--polygon", "polygon(".concat(polygon, ")"));
} 


window.addEventListener('load', function() {
	shop();
	polygon();
	window.addEventListener('scroll', function(){
		polygon();
	});
	window.addEventListener('resize', function() {
		shop();
		polygon();
	});
})