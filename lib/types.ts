export type Transaction = "Compra" | "Locação";
export interface Property { id:string; title:string; slug:string; description:string; transaction:Transaction; type:string; location:string; price:number; bedrooms:number; bathrooms:number; suites?:number; parking:number; area:number; images:string[]; featured:boolean; sold:boolean; createdAt?:unknown; updatedAt?:unknown }
