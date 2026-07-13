import { options } from "../Config/Config";

interface loadingArgs {
    setIsLoading: (value:boolean)=>void
}

export class ApiService{
    private baseUrl="http://localhost:11434/api"
    private setIsLoading:(value:boolean)=>void;


    constructor({setIsLoading}: loadingArgs){
        this.setIsLoading = setIsLoading
    }

    async sendMessage(msg: string, model: string, options: options) : Promise<string>{
        this.setIsLoading(true);
        const headers: Headers = new Headers()

        headers.set("Content-Type", "application/json")

        const requestBody = {
          "model":model,
          "prompt":msg,
          "stream":false,
          "options":options,
        }

        const request: RequestInfo = new Request(this.baseUrl + "/generate",{
          method: "POST",
          headers: headers,
          body: JSON.stringify(requestBody)
        })


        return fetch(request)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Błąd sieci: ${res.status}`)
          }
          return res.json();
        })
        .then(res => {
          this.setIsLoading(false)
          return res.response;
        }).catch(err => {
          console.error(`Problem z pobieraniem danych: ${err}`);
          this.setIsLoading(false)
          return "Nie można w tej chwili zrealizować zapytania";
        });
    }


    async getModels(): Promise<string[]>{
        const headers: Headers = new Headers()
        headers.set("Content-Type", "application/json")

        const request: RequestInfo = new Request(this.baseUrl + "/tags",{
          method: "GET",
          headers: headers,
        })

         return fetch(request)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Błąd sieci: ${res.status}`)
          }
          return res.json();
        })
        .then(res => {
          return res.models;
        }).catch(err => {
          console.error(`Problem z pobieraniem danych: ${err}`);
          return "Nie można w tej chwili zrealizować zapytania";
        });
    }

    async getActiveModels(): Promise<string[]>{
        const headers: Headers = new Headers()
        headers.set("Content-Type", "application/json")

        const request: RequestInfo = new Request(this.baseUrl + "/ps",{
          method: "GET",
          headers: headers,
        })

         return fetch(request)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Błąd sieci: ${res.status}`)
          }
          return res.json();
        })
        .then(res => {
          return res.models;
        }).catch(err => {
          console.error(`Problem z pobieraniem danych: ${err}`);
          return "Nie można w tej chwili zrealizować zapytania";
        });
    }

}