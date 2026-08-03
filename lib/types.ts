export type Transaction = "Compra" | "Locação";
export interface Property { id:string; title:string; slug:string; description:string; transaction:Transaction; type:string; location:string; address:string; price:number; bedrooms:number; bathrooms:number; parking:number; area:number; images:string[]; featured:boolean; sold:boolean; createdAt?:unknown; updatedAt?:unknown }
