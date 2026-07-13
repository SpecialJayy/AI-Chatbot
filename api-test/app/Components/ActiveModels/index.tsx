import { useState, useEffect } from "react";
import { ApiService } from "../../Services/ApiService";
import { ActiveModel } from "./ActiveModel";
import { STATUS } from "@/app/Enums/Status";

interface ActiveModelsProps {
    apiService: ApiService;
}

function isLessThanOneMinuteFromNow(dateTimeString: string): boolean {
    const inputTime = Date.parse(dateTimeString);
    const now = Date.now();

    if (isNaN(inputTime)) {
        console.error("Invalid datetime string provided");
        return false;
    }

    return Math.abs(now - inputTime) < 60000;
}

export function ActiveModels({ apiService }: ActiveModelsProps) {
    const [models, setModels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async (showLoading = false) => {
            try {
                if (showLoading) setIsLoading(true);
                
                const response = await apiService.getActiveModels();
                setModels(response);
            } catch (error) {
                console.error("Błąd podczas pobierania modeli:", error);
            } finally {
                if (showLoading) setIsLoading(false);
            }
        };

        fetchModels(true);

        const intervalId = setInterval(() => {
            fetchModels(false); 
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [apiService]);

    return (
        <div className="fixed top-0 right-0 m-2 flex flex-col gap-1">
            {isLoading ? (
                <ActiveModel name="Ładowanie" status={STATUS.DISABLED}/>
            ) : (
                models.length !== 0 ? (
                    models.map((model) => (
                        <ActiveModel 
                            key={model.name} 
                            name={model.name} 
                            status={isLessThanOneMinuteFromNow(model.expires_at) ? STATUS.EXPIRING : STATUS.ACTIVE}
                        />
                    ))
                ) : (
                    <ActiveModel name={"No active models"} status={STATUS.DISABLED}/>
                )
            )}
        </div>
    );
}