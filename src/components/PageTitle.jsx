export default function PageTitle({ eyebrow, title, text }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.35em] text-yellow-400">
        {eyebrow}
      </p>

      <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-white md:text-6xl">
        {title}
      </h1>

      {text && (
        <p className="mt-5 text-lg leading-8 text-stone-300">
          {text}
        </p>
      )}
    </div>
  );
}