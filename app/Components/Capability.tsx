interface CapabilityProps {
    capability: string;
}

export function Capability({ capability }: CapabilityProps) {
    return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-800/80 text-slate-100">
            {capability}
        </span>
    );
}