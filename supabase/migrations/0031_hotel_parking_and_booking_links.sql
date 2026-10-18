-- One-time content update for the two hotel cards' new backs: parking notes
-- (written in the same bullet/link format as FAQ answers) and the room-block
-- booking links. Both stay editable afterwards on the admin Travel page.

update travel_options
set
  parking_info = $p$- Valet is first come, first served. Oversized vehicles may cost more.
- Self-park garages are a short walk away. Reserve ahead on [SpotHero](https://spothero.com/) or [iParkit](https://www.iparkit.com/). Both also have mobile apps!
- No EV charging at valet. The Third Avenue Garage, about 5 minutes away, has it.$p$,
  booking_link = 'https://book.passkey.com/event/51343834/owner/2945954/landing'
where name ilike 'Wyndham Grand%';

update travel_options
set
  parking_info = $p$- Self-park at the Forbes Parking Garage, right next to the hotel at 400 Cherry Way.
- In-and-out privileges are included.
- EV charging is available in the same garage.$p$,
  booking_link = 'https://www.ihg.com/evenhotels/hotels/us/en/find-hotels/select-roomrate?fromRedirect=true&qSrt=sBR&qIta=99801505&icdv=99801505&qSlH=PITEV&qCiD=27&qCiMy=042027&qCoD=31&qCoMy=042027&qGrpCd=WSM&qAAR=6CBARC&qRtP=6CBARC&setPMCookies=true&qSHBrC=VN&qDest=425%20Forbes%20Avenue,%20Pittsburgh,%20PA,%20US&showApp=true&adjustMonth=false&srb_u=1&qRmFltr='
where name ilike 'EVEN Hotel%';
