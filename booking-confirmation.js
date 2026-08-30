(function(){
  const EVOS_WHATSAPP='34645772010';
  const utcStamp=(d)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const clean=(v)=>String(v??'').trim();

  function render({item,starts,bookingId}){
    const duration=Math.max(15,Number(item?.duration_minutes)||60);
    const end=new Date(starts.getTime()+duration*60000);
    const service=clean(item?.service_name)||'Servicio EVOS';
    const professional=clean(item?.professional_name)||'Profesional EVOS';
    const price=new Intl.NumberFormat('es-ES',{style:'currency',currency:item?.currency||'EUR'}).format(Number(item?.price_cents||0)/100);
    const when=new Intl.DateTimeFormat('es-ES',{dateStyle:'full',timeStyle:'short'}).format(starts);
    const title=`EVOS · ${service}`;
    const details=`Reserva EVOS\nServicio: ${service}\nProfesional: ${professional}\nPrecio: ${price}\nReserva: ${bookingId}`;
    const calendar='https://calendar.google.com/calendar/render?action=TEMPLATE'
      +'&text='+encodeURIComponent(title)
      +'&dates='+encodeURIComponent(utcStamp(starts)+'/'+utcStamp(end))
      +'&details='+encodeURIComponent(details);
    const whatsapp='https://wa.me/'+EVOS_WHATSAPP+'?text='+encodeURIComponent(
      `Hola, confirmo mi reserva EVOS.\n\nServicio: ${service}\nProfesional: ${professional}\nFecha: ${when}\nPrecio: ${price}\nReserva: ${bookingId}`
    );

    return `<div style="display:grid;gap:10px;margin-top:14px">
      <a class="login" href="${calendar}" target="_blank" rel="noopener">AÑADIR A GOOGLE CALENDAR</a>
      <a class="login" href="${whatsapp}" target="_blank" rel="noopener">CONFIRMAR POR WHATSAPP</a>
      <a class="login" href="/booking">VER MIS CITAS</a>
    </div>`;
  }

  window.EvosBookingConfirmation={render};
})();
