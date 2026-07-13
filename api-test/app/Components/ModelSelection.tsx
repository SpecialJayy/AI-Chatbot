import { useState, useEffect } from "react";
import { ApiService } from "../Services/ApiService";

interface ModelSelectionProps {
    model: string;
    setModel: (value: string) => void;
    apiService: ApiService;
}

export function ModelSelection({ model, setModel, apiService }: ModelSelectionProps) {
    const [models, setModels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.getModels();
            
                setModels(response);
            } catch (error) {
                console.error("Błąd podczas pobierania modeli:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchModels();
    }, [apiService]);

    return (
        <div className="relative flex-shrink-0">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading}
            className="w-full sm:w-40 px-4 py-3 bg-slate-100/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 border border-transparent disabled:opacity-50"
          >
            {isLoading ? (
                <option>Ładowanie...</option>
            ) : (
                models.map((option) => (
                    <option key={option.name} value={option.name}>
                        {option.name}
                    </option>
                ))
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
    );
}