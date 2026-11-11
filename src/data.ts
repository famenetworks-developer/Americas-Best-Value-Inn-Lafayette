export const hotel = {
 name:'Americas Best Value Inn Lafayette', brand:'by Sonesta', phone:'(337) 232-8826', tel:'+13372328826',
 address:'2224 NE Evangeline Trwy', city:'Lafayette, LA 70501',
 official:'https://www.sonesta.com/americas-best-value-inn/la/lafayette/americas-best-value-inn-lafayette',
 directions:'https://www.google.com/maps/dir/?api=1&destination=Americas+Best+Value+Inn+Lafayette&destination_place_id=ChIJBwC8P5CbJIYReJ64cDzSrwY',
 trip:'https://www.trip.com/hotels/lafayette-hotel-detail-3327862/super-8-by-wyndham-lafayette-la/',
};
export const rooms = [
 {name:'1 King Bed',bed:'King',tag:'Non-smoking',description:'A king-bed layout for your Lafayette stay. Check the available rate and room details for your travel dates.'},
 {name:'1 Queen Bed',bed:'Queen',tag:'Non-smoking',description:'A queen-bed option with the everyday essentials. Choose your dates on Sonesta to confirm availability.'},
 {name:'2 Double Beds',bed:'Two doubles',tag:'Non-smoking',description:'Prefer separate beds? Explore this two-double-bed layout and confirm the permitted occupancy when booking.'},
 {name:'Accessible Queen Room',bed:'Queen',tag:'Accessible · Non-smoking',description:'An accessible queen-bed category is listed. Call the hotel to discuss specific accessibility needs before reserving.'},
];
export const faqs = [
 ['Where is the hotel located?',`${hotel.name} is at ${hotel.address}, ${hotel.city}, near Interstate 10 in Lafayette, Louisiana.`],
 ['What time are check-in and check-out?','Check-in begins at 3:00 PM. Check-out is by 11:00 AM. Please call the hotel about early arrival or late departure.'],
 ['What room options are listed?','King, queen, two-double-bed and accessible queen non-smoking categories are listed on Trip.com for this address. Confirm current room availability and occupancy with Sonesta or the hotel.'],
 ['Are Wi-Fi and parking included?','Sonesta lists complimentary Wi-Fi and on-site parking, including space for cars, RVs, buses and trucks. Call ahead if you need to accommodate a large vehicle.'],
 ['Is breakfast available, and is there a pool?','Sonesta lists continental breakfast and an outdoor pool. Third-party information differs, so please call the hotel to confirm current service and pool opening before your stay.'],
 ['Can I bring a pet?','Sonesta lists a maximum of two pets per room at $25 per pet, per night. Confirm a pet-friendly room and the current fee directly before booking.'],
 ['How do I see prices and cancellation terms?','Follow Check availability to the official Sonesta hotel page. Select your dates there to see live rates, available rooms, taxes and the cancellation conditions for your chosen rate.'],
 ['How can I contact the hotel?',`Call ${hotel.phone}. For group travel inquiries, Sonesta lists Sales@redlion.com as its sales contact.`],
];
export const nav = [['Rooms','rooms'],['Amenities','amenities'],['Location','location'],['Gallery','gallery']] as const;
