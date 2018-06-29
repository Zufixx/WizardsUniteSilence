# Hello World!s Ljudmätare för användning på projektor
## Utvecklat för Unityspåret av Albin Byström, Filip Bergkvist och till en liten liten del av Marcus Karåker.

# Instruktioner
## Filer
Ladda ner hela repo:n med git eller som en zip fil.
Det finns två mappar som heter Angry och Happy, i dessa ligger just nu trollkarlsbilder. Byt ut dessa bilder mot egna som passar ert spår eller tema. Se till att det endast är bilder som funkar i en <img> tagg.
## Paths
Tyvärr då allting är javascript på klienten så kan vi inte direkt accessa filer eller mappar, detta innebär att ni måste skriva in paths till de filer ni lagt till i javascript filen. I main.js finns en "angryImages" och en "happyImages" array av strängar som pekar mot bilder programmet ska välja mellan. Ändra dessa till era egna.
Jag önskar att det fanns en bättre lösning men då måste vi hosta det på en server :/

## Videor
Vid en högre gräns så har programmet stöd för att spela upp youtube-klipp! Lägg in youtubeklippets ID (de sista siffrorna efter ?v= i en youtube url) så kan den väljas vid högsta volym gränsen! Se till att ha högtalare ikopplade bara c:

## Inställningar
I main.js finns flera inställningar, som sensetivity, buffer_length, Angry_Limit etc. Dessa beskrivs i mer detalj i kommentarer i skriptet. Läs dem gärna.

## Starta programmet
Öppna index.html i din webbläsare. En notis ska be om tillstånd att använda mikrofonen. När sidan har fått det så ska programmet vara igång. För att se om det funkar rätt så kan ni scrolla ner till en mätare långt ner på sidan.

### Mätare?
Längst ner under sidan (som är väldigt fint byggd med dynamisk css och sånt) finns en mätare och en slider. Dra i slidern för att ändra känsligheten på när det är för högt. Den ska matcha perfekt med ljudmätaren ovanför. Blir mätaren röd så är det högt, grönt så är det lågt. Där står även avg värdet, alltså avarage.

### Avarage?!?
Ja! Det är så programmet funkar. I en array som programmet går igenom ett element per uppdatering så läggs en etta om det är högt och en nolla om det är lågt. Medelvärdet av arrayen är det som bestämmer om programmet ska byta bild eller inte!

### När sker bytet
I main.js finns en Angry_Limit och Video_Limit. Ändra dessa för att justera hur högt medelvärdet måste vara för att byta bild eller till video.

## Debug
För att det ska funka bra så får ni nog justera ganska många inställningar. För att få lite mer info så kan ni alltid öppna Developer Tools i er webbläsare där flera värden skrivs ut varje sekund.

## Varför skriver du så mycket Filip?
Jag gillar att skriva, och mitt tåg kanske har stått still på Stockholm Södra i 20 minuter nu p.g.a tågfel c:

# Hoppas det funkar! Finns i chatten. (Slack)
