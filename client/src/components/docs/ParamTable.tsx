interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface Props {
  params: Param[];
  title?: string;
}

export default function ParamTable({ params, title }: Props) {
  return (
    <div className="my-4">
      {title && (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">{title}</h3>
      )}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden sm:table-cell">Required</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map(p => (
              <tr key={p.name} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-indigo-600 font-medium text-xs">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">{p.type}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {p.required && <span className="text-[10px] font-bold text-red-600 uppercase">Required</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
