"use client"; // Required for useEffect and useRef

import { useEffect, useRef } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function PrivacyPolicyPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger

  useEffect(() => {
    // Existing BlurScrollEffect logic for contentRef
    if (contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, []);

  useEffect(() => {
    // New Parallax Effect for backgroundRef
    if (backgroundRef.current && mainElementRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainElementRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(backgroundRef.current, {
        yPercent: -15,
        ease: "none",
      });

      return () => {
        tl.kill(); // Kill the timeline and its ScrollTrigger
      };
    }
  }, []);

  return (
    <div className="relative">
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] bg-[url('https://picsum.photos/1920/1080')] bg-cover bg-center"
        ></div>
      </div>

      <main
        ref={mainElementRef}
        className="relative flex min-h-screen text-black"
      >
        {/* Left Column (Sticky Title) */}
        <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
          <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
            privacy policy
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-3xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Phasellus egestas tellus rutrum tellus pellentesque eu. Tincidunt
              dui ut ornare lectus sit amet est placerat. Purus semper eget duis
              at tellus at urna condimentum. Nunc sed velit dignissim sodales ut
              eu sem integer vitae. Quis lectus nulla at volutpat diam ut
              venenatis tellus in. Elementum sagittis vitae et leo duis ut diam
              quam nulla. Sit amet luctus venenatis lectus magna fringilla urna
              porttitor. Nec sagittis aliquam malesuada bibendum arcu vitae
              elementum. Turpis egestas pretium aenean pharetra magna ac
              placerat vestibulum lectus. Viverra justo nec ultrices dui sapien
              eget mi proin sed. Convallis a cras semper auctor neque vitae
              tempus quam. Tincidunt arcu non sodales neque sodales ut etiam
              sit. Ornare aenean euismod elementum nisi quis eleifend quam
              adipiscing vitae.
            </p>
            <p>
              Risus pretium quam vulputate dignissim suspendisse in est ante in.
              Nunc consequat interdum varius sit amet mattis. Tellus elementum
              sagittis vitae et leo duis ut diam. Ac odio tempor orci dapibus
              ultrices in iaculis nunc sed. Ut lectus arcu bibendum at varius
              vel. Pellentesque habitant morbi tristique senectus et netus et
              malesuada. Erat nam at lectus urna duis convallis convallis
              tellus. Sit amet consectetur adipiscing elit duis tristique
              sollicitudin nibh sit. Vulputate eu scelerisque felis imperdiet
              proin fermentum leo vel orci. Nunc vel risus commodo viverra
              maecenas accumsan lacus vel. Lectus sit amet est placerat in
              egestas erat imperdiet sed. Eget nullam non nisi est sit amet
              facilisis magna etiam.
            </p>
            <p>
              Volutpat consequat mauris nunc congue nisi vitae suscipit tellus
              mauris. Orci eu lobortis elementum nibh tellus molestie nunc non
              blandit. Metus vulputate eu scelerisque felis imperdiet proin
              fermentum. Justo laoreet sit amet cursus sit amet dictum sit amet.
              Viverra nam libero justo laoreet sit amet cursus. Eu nisl nunc mi
              ipsum faucibus vitae aliquet nec. Vitae purus faucibus ornare
              suspendisse sed nisi lacus sed viverra. Egestas purus viverra
              accumsan in nisl nisi scelerisque eu. Massa tincidunt dui ut
              ornare lectus sit amet est placerat. In tellus integer feugiat
              scelerisque varius morbi enim nunc faucibus.
            </p>
            <p>
              Another paragraph to make the content longer and enable scrolling
              for the effect. Sed ut perspiciatis unde omnis iste natus error
              sit voluptatem accusantium doloremque laudantium, totam rem
              aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo.
            </p>
            <p>
              Yet another paragraph. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni
              dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
              quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur,
              adipisci velit.
            </p>
            <p>
              Final paragraph for scrolling test. Ut enim ad minima veniam, quis
              nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
              aliquid ex ea commodi consequatur? Quis autem vel eum iure
              reprehenderit qui in ea voluptate velit esse quam nihil molestiae
              consequatur.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
