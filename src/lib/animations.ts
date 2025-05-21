import SplitType, { TypesList } from "split-type";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Basic TextSplitter
class TextSplitter {
  private splitTextInstance: SplitType;
  public words: HTMLElement[];

  constructor(
    textElement: HTMLElement,
    options: { splitTypeTypes?: string } = {}
  ) {
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error("Invalid text element provided.");
    }
    const splitOptions: { types?: TypesList } = {};
    if (options.splitTypeTypes) {
      splitOptions.types = options.splitTypeTypes
        .split(",")
        .map((s) => s.trim()) as TypesList;
    }

    this.splitTextInstance = new SplitType(textElement, splitOptions);
    this.words = this.splitTextInstance.words || [];
  }

  getWords(): HTMLElement[] {
    return this.words;
  }
}

// BlurScrollEffect for Effect 4
export class BlurScrollEffect_Effect4 {
  private textElement: HTMLElement;
  private splitter!: TextSplitter;

  constructor(textElement: HTMLElement) {
    if (!textElement || !(textElement instanceof HTMLElement)) {
      throw new Error("Invalid text element provided.");
    }
    this.textElement = textElement;
    this.initializeEffect();
  }

  private initializeEffect() {
    this.splitter = new TextSplitter(this.textElement, {
      splitTypeTypes: "words",
    });
    this.scroll();
  }

  private scroll() {
    const words = this.splitter.getWords();
    if (!words || words.length === 0) {
      console.warn(
        "SplitType found no words to animate for:",
        this.textElement
      );
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      words,
      {
        opacity: 0,
        skewX: -20,
        filter: "blur(8px)",
        willChange: "filter, transform, opacity",
      },
      {
        ease: "sine.out",
        opacity: 1,
        skewX: 0,
        filter: "blur(0px)",
        stagger: 0.04,
        scrollTrigger: {
          trigger: this.textElement,
          start: "top bottom-=5%",
          end: "bottom bottom-=5%",
          scrub: true,
        },
      }
    );
  }
}
