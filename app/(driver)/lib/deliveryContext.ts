const clean=(value:unknown)=>String(value??'').trim();
/** A commerce delivery has a real recipient; a store request uses its physical waybill. */
export function deliveryIdentity(order:any){
 const commerce=order?.requestOrigin==='COMMERCE_ORDER'||order?.serviceSnapshot?.origin?.type==='COMMERCE_ORDER';
 const logistics=order?.serviceSnapshot?.cityConfig?.cityOverrides?.establishmentDelivery===true||['DELIVERY','DOMICILIO','DOMICILIO_EXPRESS','DOMI_EXPRESS','PICKUP_AND_DELIVERY','PICKUP_DELIVERY'].includes(clean(order?.serviceSnapshot?.definition?.serviceKey||order?.serviceKey||order?.serviceType).toUpperCase());
 const external=!commerce&&(order?.requestOrigin==='ESTABLISHMENT_REQUEST'||(logistics&&order?.orderType==='COURIER'&&order?.customer?.role==='STORE'&&!!order?.customer?.storeId));
 return {requestOrigin:commerce?'COMMERCE_ORDER':external?'ESTABLISHMENT_REQUEST':null,
 establishmentName:commerce||external?clean(order?.establishmentName||(external?order?.customer?.store?.name:'')||order?.pickupPlaceName||order?.pickupLocations?.[0]?.placeName||order?.senderName):'',
 senderName:clean((external?order?.customer?.store?.name:'')||order?.senderName||order?.origin?.senderName),senderPhone:clean((external?order?.customer?.store?.cel1||order?.customer?.store?.cel2:'')||order?.senderPhone||order?.origin?.senderPhone),
 receiverName:clean(order?.receiverName||order?.destination?.receiverName),receiverPhone:clean(order?.receiverPhone||order?.destination?.receiverPhone)};
}
export function isCommerceDelivery(order:any){return deliveryIdentity(order).requestOrigin==='COMMERCE_ORDER';}
export function isEstablishmentDelivery(order:any){return !!deliveryIdentity(order).requestOrigin;}
export function deliveryServiceLabel(order:any,label:string){const identity=deliveryIdentity(order);return identity.establishmentName?`${label} · ${identity.establishmentName}`:label;}
