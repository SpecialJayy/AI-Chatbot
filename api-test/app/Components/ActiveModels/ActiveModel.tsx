import { STATUS } from "../../Enums/Status";

interface ActiveModelProps {
    name:string,
    status: STATUS
}

export function ActiveModel({name, status} : ActiveModelProps){
    return(
        <div className="w-full min-w-[12rem] sm:w-auto flex justify-between items-center gap-4 px-4 py-3 bg-slate-100/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 text-sm font-medium rounded-xl border border-transparent transition-all">

          <div className="text-slate-800 dark:text-zinc-100 text-sm truncate pr-2" title={name}>
            {name}
          </div>

          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status}`}></div>

        </div>
    ) 
}