import { useState, useEffect } from "react";
import { ApiService } from "../../Services/ApiService";
import { ActiveModel } from "./ActiveModel";
import { STATUS } from "@/app/Config/Enums";

interface ActiveModelsProps {
  apiService: ApiService;
}

export function ActiveModels({ apiService }: ActiveModelsProps) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async (showLoading = false) => {
      try {
        if (showLoading) setIsLoading(true);
        
        const response = await apiService.getActiveModels();
        setModels(response);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };

    fetchModels(true);

    const intervalId = setInterval(() => {
      fetchModels(false); 
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [apiService]);

  return (
    <div className="fixed top-0 right-0 m-2 flex flex-col gap-1">
      {isLoading ? (
        <ActiveModel name="Ładowanie" status={STATUS.DISABLED} />
      ) : models.length !== 0 ? (
        models.map((modelName) => (
          <ActiveModel 
            key={modelName} 
            name={modelName} 
            status={STATUS.ACTIVE}
          />
        ))
      ) : (
        <ActiveModel name="No active models" status={STATUS.DISABLED} />
      )}
    </div>
  );
}