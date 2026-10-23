// All worker requests share the same cookie session and renewal flight.
import { apiFetch as fetchWithSession } from './apiFetch';
export type ApiError = {status:number;message:string};
export async function apiFetch<T>(path:string,options:RequestInit={},accessToken?:string|null):Promise<T> {
 const headers=new Headers(options.headers||{});
 if(accessToken)headers.set('Authorization',`Bearer ${accessToken}`);
 return fetchWithSession<T>(path,{...options,headers});
}
