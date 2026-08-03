import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; import type { Property } from "@/lib/types";
export const subscribeProperties=(callback:(items:Property[])=>void)=>onSnapshot(query(collection(db,"properties"),orderBy("createdAt","desc")),s=>callback(s.docs.map(d=>({id:d.id,...d.data()} as Property))));
export const saveProperty=async(data:Omit<Property,"id">,id?:string)=>{const ref=id?doc(db,"properties",id):doc(collection(db,"properties")); await setDoc(ref,{...data,slug:data.slug||ref.id,updatedAt:serverTimestamp(),...(id?{}:{createdAt:serverTimestamp()})},{merge:true}); return ref.id};
export const removeProperty=(id:string)=>deleteDoc(doc(db,"properties",id));
export const setSold=(id:string,sold:boolean)=>updateDoc(doc(db,"properties",id),{sold,updatedAt:serverTimestamp()});
