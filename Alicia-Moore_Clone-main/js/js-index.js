function index(){
	var width = $(window).innerWidth(),
		height = $(window).innerHeight();

	gsap.defaults({ease: "none", duration: 2});

	let section1panel = gsap.utils.toArray(".section1 .panel"),
		section1length = section1panel.length*height*2,
		firstpanelpos = (width-$('.section1 .panel.first').width())/2;
	const section1gap = 40*(width/100);

	$(".section1").css('height', ' ' + section1length + 'px ');
	$(".section1 .container").css('column-gap', ' ' + section1gap +  'px ');
	$(".section1 .panel.first").css('marginLeft', ' ' + firstpanelpos + 'px ');
	$(".section1 .panel.first").css('marginRight', ' ' + firstpanelpos-section1gap/4 + 'px ');
	// $(".section1 .panel .pic1").css('margin-top', ' ' + (height - $(".section1 .panel .pic1").height())/2 + 'px ');
	// $(".section1 .panel .pic2").css('margin-top', ' ' + (height - $(".section1 .panel .pic2").height())/2 + 'px ');
	// $(".section1 .panel .pic3").css('margin-top', ' ' + (height - $(".section1 .panel .pic3").height())/2 + 'px ');
	// $(".section1 .panel .pic4").css('margin-top', ' ' + (height - $(".section1 .panel .pic4").height())/2 + 'px ');



	$(".section1 .panel img").each(function() {
		$(this).css('margin-top', ' ' + (height - $(this).height())/2 + 'px ');
	});

	gsap.to(".section1 .container", {
		scrollTrigger: {
			trigger: ".section1",
			start: "top top",
			end: "bottom bottom",
			pin: ".section1 .container",
			pinSpacing: false,
			scrub: true,
			markers: false,
		}
	});
	var lastpanel = $(".section1 .panel.last"),
		lastpanelmove = lastpanel.offset().left + lastpanel.width()-width;
	gsap.to(section1panel, {
		scrollTrigger: {
			trigger: ".section1",
			start: "top top",
			end: () => "+=" + (section1length - 2*height),
			scrub: true,
			markers: false,
			id: "section1-move",
		},
		ease: "power1.out",
		x: () => "+=" + -(lastpanelmove),
	});


	$(".section2").css('top', ' ' + (section1length - height) +'px ');
	$(".section3").css('top', ' ' + (section1length) +'px ');

	// gsap.to(".section2", {
	// 	scrollTrigger: {
	// 		trigger: ".section2",
	// 		start: "top top",
	// 		end: "bottom top",
	// 		pin: ".section2",
	// 		markers: false,
	// 	}
	// });
	gsap.to(".section3 .container img", {
		scrollTrigger: {
			trigger: ".section3 .container",
			start: "top bottom",
			end: "bottom top",
			scrub: true,
			markers: false,
		},
		y:() => "+=" + (.3*$(".section3 .container img").height()),
	});
	let section3length = $(".section3").height();
	$(".section4").css('top', ' ' + (section1length+section3length) +'px ');


	// $(".section4 img").each(function() {
	// 	gsap.to($(this), {
	// 		scrollTrigger: {
	// 			trigger: $(this),
	// 			start: "top bottom",
	// 			end: "bottom top",
	// 			scrub: 1,
	// 			markers: true,
	// 		},
	// 		yPercent: -100
	// 	})
	// });

	gsap.to(".section4 .pic1", {
		scrollTrigger: {
			trigger: ".section4 .pic1",
			start: "top bottom",
			endTrigger: ".section4",
			end: "bottom top",
			scrub: 2,
			markers: false
		},
		yPercent: -100,
	});
	gsap.to(".section4 .pic2", {
		scrollTrigger: {
			trigger: ".section4 .pic2",
			start: "top bottom",
			endTrigger: ".section4",
			end: "bottom top",
			scrub: .8,
			markers: false
		},
		yPercent: -100
	});
	gsap.to(".section4 .pic3", {
		scrollTrigger: {
			trigger: ".section4 .pic3",
			start: "top bottom",
			endTrigger: ".section4",
			end: "bottom top",
			scrub: 1,
			markers: false
		},
		yPercent: -80
	});
	gsap.to(".section4 .pic4", {
		scrollTrigger: {
			trigger: ".section4 .pic4",
			start: "top bottom",
			endTrigger: ".section4",
			end: "bottom top",
			scrub: .5,
			markers: false
		},
		yPercent: -100
	});
	gsap.to(".section4 .pic5", {
		scrollTrigger: {
			trigger: ".section4 .pic5",
			start: "top bottom",
			endTrigger: ".section4",
			end: "bottom top",
			scrub: .5,
			markers: false
		},
		yPercent: -100
	});
	let section4length = $(".section4").height();
	$("#footer").css('height', ' ' + (section1length+section3length+section4length+height*.55) +'px ');

	gsap.to(".navigation", {
		scrollTrigger: {
			trigger: ".section2",
			start: "-100px bottom",
			endTrigger: ".section4",
			end: "bottom 55%",
			toggleClass: {targets: ".navigation", className: "lg-at-small"},
			markers: false,
		}
	});

	$(".navigation .custom-fragment").hover(function() {
		if ($(".navigation").hasClass("lg-at-small")) {
			$(".navigation").addClass("hover-to-big")
		}
	}, function() {
		if ($(".navigation").hasClass("lg-at-small")) {
			$(".navigation").removeClass("hover-to-big")
		}
	})
}

function polygon() {
	const root = document.querySelector(':root');

	var w = $(window).innerWidth(),
		h = $(window).innerHeight(),
		sr = $(window).scrollTop(),
		b = 50;

	var	s3 = $(".section3").offset().top - sr,
		sh3 = s3 + $(".section3 .text").height() + b*2,
		s4 = $(".section4").offset().top - sr,
		sh4 = s4 + $(".section4").height();

	var tl1 = "0px ".concat(s3, "px"),
		tr1 = "".concat(w, "px ").concat(s3, "px"),
		br1 = "".concat(w, "px ").concat(sh3, "px"),
		bl1 = "0px ".concat(sh3, "px"),
		tl2 = "0px ".concat(s4, "px"),
		tr2 = "".concat(w, "px ").concat(s4, "px"),
		br2 = "".concat(w, "px ").concat(sh4, "px"),
		bl2 = "0px ".concat(sh4, "px");

	var p1 = "".concat(tl1, ", "),
		p2 = "".concat(bl2, ", "),
		p3 = "".concat(bl1, ", "),
		p4 = "".concat(br1, ", "),
		p5 = "".concat(tr2, ", "),
		p6 = "".concat(tl2, ", "),
		p7 = "".concat(bl2, ", "),
		p8 = "".concat(br2, ", "),
		p9 = "".concat(tr1);

	var polygon = "".concat(p1).concat(p2).concat(p3).concat(p4).concat(p5).concat(p6).concat(p7).concat(p8).concat(p9);
	document.documentElement.style.setProperty("--polygon", "polygon(".concat(polygon, ")"))
} 

window.addEventListener('load', function() {
	index();
	polygon();
	window.addEventListener('scroll', function(){
		polygon();
	});
	window.addEventListener('resize', function() {
		index();
		polygon();
	});
})