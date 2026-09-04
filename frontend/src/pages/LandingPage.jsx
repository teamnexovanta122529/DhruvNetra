import AntarcticaScene
  from "../components/antarctica/AntarcticaScene";

export default function LandingPage() {

  return (

    <main className="relative h-screen w-full overflow-hidden bg-slate-950">

      {/* THREE.JS BACKGROUND */}

      <div className="absolute inset-0 z-0">

        <AntarcticaScene />

      </div>


      {/* DARK CINEMATIC OVERLAY */}

      <div
        className="
          absolute
          inset-0
          z-10
          bg-gradient-to-r
          from-slate-950/70
          via-slate-900/20
          to-transparent
          pointer-events-none
        "
      />


      {/* CONTENT */}

      <div
        className="
          relative
          z-20
          flex
          h-full
          items-center
          px-8
          md:px-20
        "
      >

        <div className="max-w-2xl">

          <p
            className="
              mb-5
              text-xs
              tracking-[0.4em]
              text-white/70
              animate-pulse
            "
          >
            INDIAN ANTARCTIC RESEARCH
          </p>

          <h1
            className="
              text-6xl
              font-semibold
              leading-[0.9]
              tracking-tight
              text-white
              md:text-8xl
            "
          >
            DHRUV
            <br />
            NETRA
          </h1>

          <p
            className="
              mt-7
              max-w-xl
              text-lg
              leading-relaxed
              text-white/70
            "
          >
            Intelligent digital monitoring
            for India's Antarctic research
            stations.
          </p>

          <button
            className="
              mt-8
              rounded-full
              border
              border-white/30
              bg-white/10
              px-7
              py-3
              text-sm
              text-white
              backdrop-blur-md
              transition
              duration-500
              hover:bg-white
              hover:text-slate-900
              hover:px-9
            "
          >
            ENTER DIGITAL TWIN
          </button>

        </div>

      </div>

    </main>
  );
}