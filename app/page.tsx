import AnimatedLogo from "./components/AnimatedLogo";

export default function Home() {
  return (
    <main className="snap-container">
      {/* Animated Logo */}
      <AnimatedLogo />

      {/* Image Carousel Section */}
      <section className="w-full h-screen pt-[128px] bg-gradient-to-b from-[#151211] to-[#231F20] text-white flex items-center justify-center image-carousel-section relative snap-section">
        <h2 className="text-3xl font-bold">Image Carousel Section</h2>
      </section>

      {/* Collection Section */}
      <section className="w-full h-screen pt-[128px] bg-white text-black flex items-center justify-center collection-section snap-section">
        <h2 className="text-3xl font-bold">Collection Section</h2>
      </section>
    </main>
  );
}
