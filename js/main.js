import { personIcon } from "./constant.js";
import { getNoteIcon, getStatus } from "./helper.js";
import elements from "./ui.js";


//*Global Variables
let clickedCoords;
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let layer;
var map;

window.navigator.geolocation.getCurrentPosition(
    (e) => {

        //Eğer kullanıcı konum bilgisini paylaşırsa uygulamayı bu komunda başlat
        loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
    },
    //Eğer konum bilgisini paylaşmazsa uygulamayı varsayılan konumda başlat (Antalya)
    (e) => {
        loadMap([36.889631, 30.696760

        ], "Varsayılan Konum");
    }
);

//!Harita oluşturan fonksiyon
function loadMap(currentPosition, message) {

    //Harita kapsayıcısının kurulumu ve default zoom çubuğunu iptal et

     map = L.map('map', { zoomControl: false }).setView(currentPosition, 10);

    //Harita Content Kurulumu
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //Haritanın zoom kontrol kısmını konumunu ayarla
    L.control.zoom({ position: "bottomright" }).addTo(map);


    //Kullanıcının başlangıç konumuna bir marker ekle
    L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(message);

    //Harita üzerine bir layer katmanı ekle
     layer =L.layerGroup().addTo(map);

     

    //Harita üzerindeki tıklanma olaylarını izleyen fonksiyon
    map.on('click', onMapClick);

    //Notları render et
    renderNotes();

    //Markerleri render et
    renderMarkers();

}

//Harite üzerinde tıklanma olayı gerçekleşince çalışacak fonksiyon
function onMapClick(e) {
    //Harita üzerinde tıklanılan  yerin kordinatın clickedCoords adındaki global scopa'a sahip elemana aktar.
    clickedCoords = [e.latlng.lat, e.latlng.lng]

    //Aside kısmını ekleme moduna geçir
    elements.aside.classList.add("add");
}

//Cancel Btn'e tıklayınca aside kısmını eski haline çeviren fonksiyon

elements.canselBtn.addEventListener("click", () => {
    elements.aside.classList.remove("add");
})

//Form gönderildiğinde çalışacak fonksiyon
elements.form.addEventListener("submit", (e) => {
    //Sayfa yenilenmesini engelle
    e.preventDefault();

    //Form içerisindeki değerlere eriş
    const title = e.target[0].value;
    const date = e.target[1].value;
    const status = e.target[2].value;

    //Bir note objesi oluştur
    const newNote = {
        id: new Date().getTime(),
        title,
        date,
        status,
        coords: clickedCoords
    }
    //Note objseni notes dizisine ekle

    notes.push(newNote);

    //LocalStorage'e güncelle
    localStorage.setItem("notes", JSON.stringify(notes));

    //Formu resetle
    e.target.reset();

    //Aside kısmını eski haline çevir
    elements.aside.classList.remove("add");

    //notları render et
    renderNotes();

    //Markerleri render et
    renderMarkers();
})

//Mevcut notları aside kısmındaki liste içerisinde renderlayan fonksiyon

function renderNotes() {
    //Notes dizisini dönüp her bir note için bir html oluştur
   const noteCards= notes.map((note) => {
    //tarih ayarlaması yap
  const date =  new Date(note.date).toLocaleDateString("tr" , {
        day:"numeric",
        month: "long",
        year:"numeric",
    })
    return `
        <li>
                <div>
                    <p>${note.title}</p>
                    <p>${date}</p>
                    <p>${getStatus(note.status)}</p>
            </div>
            <div class="icons">
                <i  data-id="${note.id}" class="bi bi-airplane-fill" id="fly-btn"></i>
                <i data-id="${note.id}" class="bi bi-trash-fill" id="delete-btn"></i>
            </div>
        
        </li>`
   }).join("");


    //Elde edilen Html'i aside kısmındaki listeye aktar
    elements.noteList.innerHTML= noteCards;

    //Delet ıconlara eriş
     document.querySelectorAll("#delete-btn").forEach((btn) => {
        //Silenecek elemanın id'sine sil iconuna atanan id değerinden al ve bunu id değişkenine ata
        const id = btn.dataset.id;
        btn.addEventListener("click", () => {
            //Silme işlemi yapacak fonksiyona silinecek elemanın id'sine ver
            deleteNote(id);
        })
    });

    //Fly ıconlarına eriş 
    document.querySelectorAll("#fly-btn").forEach((btn) => {
        btn.addEventListener("click", () => {

            //Uçulacak elemanın id'sini fly iconundan al
           const id = btn.dataset.id

           //Elde edilen uçuş iconunu flyToNote fonksiyonuna parametre olarak geç
            flyNote(id);
        })
    })
}

//!silme işlemi yapan fonksiyon
function deleteNote (id) {

    //Kullanıcıdan silme işlemi için onay al
   const response = confirm("Not silme işlemini onaylıyor musunuz?")

    //Eğer kullanıcı silme işlemini onayladıysa id'si bilinen notu sil

    if(response){
     notes = notes.filter((note) => note.id != id);

     //Silme işlemi sonrasında localStorga'ı güncelle
     localStorage.setItem("notes",JSON.stringify(notes));

     //Notları render et
     renderNotes();

     //Markerleri render et
     renderMarkers();
    }
}


//!Bir nota uçma özelliği gerçekleştiren fonksiyon
function flyNote(id){

    //Id'si bilinen elemanı note dizisi içerisinden bul
   const foundedNote = notes.find((note) =>note.id == id);

   //Bulanan elemana uç
   map.flyTo(foundedNote.coords,11)
   
}





//Mevcut notları için birer marker render enden fonksiyon
function renderMarkers(){

    //Harita'daki markerları sıfırla
    layer.clearLayers();
    //notlar dön ve herbir note için birer marker render et
    notes.map((note) =>{
        const icon= getNoteIcon(note.status);
        //Marker render et
        L.marker(note.coords,{icon}).addTo(layer);
    })
}


//Aside kısmına hide mode'e sokan fonksiyon
elements.arrowIcons.addEventListener("click" , () => {
    elements.aside.classList.toggle("hide")
})