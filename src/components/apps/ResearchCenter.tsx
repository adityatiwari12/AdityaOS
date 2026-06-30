import { userConfig } from '../../config/index';

export default function ResearchCenter() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar text-gray-200 p-6">
      <h1 className="text-2xl font-bold mb-2">Research Center</h1>
      <p className="text-gray-400 text-sm mb-8">Peer-reviewed publications & research awards</p>

      <div data-tour-id="rc-publications" className="space-y-6">
        {userConfig.publications.map((pub, i) => (
          <article key={i} className="p-5 rounded-xl bg-white/5 border border-white/10">
            <h2 className="font-semibold text-lg">{pub.title}</h2>
            {pub.authors && <p className="text-sm text-gray-500 mt-1">{pub.authors}</p>}
            <p className="text-sm text-indigo-400 mt-1">{pub.venue} · {pub.year}</p>
            {pub.description && <p className="text-sm text-gray-400 mt-3">{pub.description}</p>}
            {pub.doi && (
              <a href={pub.url ?? `https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-blue-400 hover:underline">
                DOI: {pub.doi}
              </a>
            )}
            {pub.awards && pub.awards.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pub.awards.map((a) => (
                  <span key={a} className="text-xs bg-amber-600/20 text-amber-300 px-2 py-1 rounded">{a}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <section data-tour-id="rc-certifications" className="mt-10">
        <h2 className="text-lg font-semibold mb-4">Certifications</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {userConfig.certifications.slice(0, 8).map((c, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5 text-sm">
              <p className="font-medium">{c.title}</p>
              <p className="text-gray-500 text-xs">{c.issuer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
