  function adjustSalesQty(change){
    const input=document.getElementById("qty");
    if(!input)return;
    const current=Math.max(1,Math.floor(Number(input.value)||1));
    input.value=Math.max(1,current+change);
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }
  document.addEventListener("DOMContentLoaded",function(){
    const input=document.getElementById("qty");
    if(input){
      input.addEventListener("blur",function(){
        const value=Math.floor(Number(input.value));
        input.value=Number.isFinite(value)&&value>=1?value:1;
      });
    }
  });
