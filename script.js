// ------------------------
// คำนวณ AHU
document.getElementById("ahuForm").addEventListener("submit", function(e) {
  e.preventDefault();

  let inputAirflow = parseFloat(document.getElementById("airflow").value);
  const airflowUnit = document.getElementById("airflowUnit").value;
  const staticPressure = parseFloat(document.getElementById("static").value);
  const efficiency = parseFloat(document.getElementById("efficiency").value);
  const ratedPower = parseFloat(document.getElementById("power").value);
  const ratedRPM = parseFloat(document.getElementById("rpm").value);
  const ratedFreq = parseFloat(document.getElementById("freq").value);

  // แปลง airflow เป็น m³/h สำหรับคำนวณ (ฐานคือ m³/h)
  let airflowForCalc;
  switch (airflowUnit) {
    case "cfm":
      airflowForCalc = inputAirflow * 1.699;
      break;
    case "ls":
      airflowForCalc = inputAirflow * 3.6;
      break;
    case "m3h":
    default:
      airflowForCalc = inputAirflow;
      break;
  }

  // คำนวณ actual power
  const actualPower = (airflowForCalc / 3600) * staticPressure / (efficiency * 1000);
  const powerRatio = actualPower / ratedPower;
  const rpmRatio = Math.cbrt(powerRatio);
  const actualRPM = ratedRPM * rpmRatio;
  const actualFreq = ratedFreq * rpmRatio;
  const powerMargin = ratedPower - actualPower;
  const powerMarginPercent = (powerMargin / ratedPower) * 100;

  // แสดงผล airflow ตามหน่วยที่ผู้ใช้เลือก (inputAirflow) พร้อมหน่วย
  // กำหนดชื่อหน่วยแสดงผลตาม airflowUnit
  let unitText;
  switch (airflowUnit) {
    case "cfm": unitText = "CFM"; break;
    case "ls": unitText = "L/s"; break;
    case "m3h":
    default:
      unitText = "m³/h"; break;
  }

  const outputAhu = 
`⚡ พลังงานที่ใช้จริง: ${actualPower.toFixed(2)} kW
🔁 ความเร็วรอบที่ใช้จริง: ${actualRPM.toFixed(0)} RPM
📊 ความถี่ที่ใช้จริง: ${actualFreq.toFixed(2)} Hz
🟢 Power Margin: ${powerMargin.toFixed(2)} kW (${powerMarginPercent.toFixed(1)}%)`;

  const resultAhu = document.getElementById("resultAhu");
  resultAhu.style.display = "block";
  resultAhu.textContent = outputAhu;
});



// ------------------------
// คำนวณ Dew Point

document.getElementById("calcDewBtn").addEventListener("click", function() {
  const tempInput = document.getElementById("temp").value.trim();
  const tempUnit = document.getElementById("tempUnit").value;
  const rhInput = document.getElementById("rh").value.trim();
  const dewInput = document.getElementById("dewPoint").value.trim();
  const resultDew = document.getElementById("resultDew");

  const T_in = tempInput !== "" ? parseFloat(tempInput) : NaN;
  const RH = rhInput !== "" ? parseFloat(rhInput) : NaN;
  const DewPoint_in = dewInput !== "" ? parseFloat(dewInput) : NaN;

  let filledCount = 0;
  if(!isNaN(T_in)) filledCount++;
  if(!isNaN(RH)) filledCount++;
  if(!isNaN(DewPoint_in)) filledCount++;

  if(filledCount < 2) {
    resultDew.style.display = "block";
    resultDew.textContent = "กรุณาใส่ค่าอย่างน้อย 2 ค่าเพื่อคำนวณค่าอีกตัวที่ขาดหาย";
    return;
  }

  if(!isNaN(RH) && (RH < 0 || RH > 100)) {
    resultDew.style.display = "block";
    resultDew.textContent = "ค่าความชื้นสัมพัทธ์ (RH) ต้องอยู่ระหว่าง 0 - 100";
    return;
  }

  // ฟังก์ชันแปลงหน่วยและคำนวณ Dew Point (เหมือนเดิม)
  function fToC(f) {
    return (f - 32) * 5 / 9;
  }
  function cToF(c) {
    return (c * 9 / 5) + 32;
  }
  function calcDewPoint(T, RH) {
    const a = 17.27;
    const b = 237.7;
    const gamma = Math.log(RH/100) + (a * T) / (b + T);
    return (b * gamma) / (a - gamma);
  }
  function calcRH(T, DewPoint) {
    const a = 17.27;
    const b = 237.7;
    const numerator = Math.exp((a * DewPoint) / (b + DewPoint));
    const denominator = Math.exp((a * T) / (b + T));
    return 100 * (numerator / denominator);
  }
  function calcTemp(DewPoint, RH) {
    const a = 17.27;
    const b = 237.7;
    let T = DewPoint;
    let f, df;
    for(let i=0; i<10; i++) {
      const gammaT = (a * T) / (b + T);
      const gammaD = (a * DewPoint) / (b + DewPoint);
      f = (Math.log(RH/100) + gammaT) - gammaD;
      df = (a * b) / Math.pow(b + T, 2);
      T = T - f / df;
    }
    return T;
  }

  let T = !isNaN(T_in) ? (tempUnit === "F" ? fToC(T_in) : T_in) : NaN;
  let DewPoint = !isNaN(DewPoint_in) ? (tempUnit === "F" ? fToC(DewPoint_in) : DewPoint_in) : NaN;

  let output = "";

  try {
    if (!isNaN(T) && !isNaN(RH) && isNaN(DewPoint)) {
      DewPoint = calcDewPoint(T, RH);
      output += `อุณหภูมิ: ${tempUnit === "F" ? cToF(T).toFixed(2) + " °F" : T.toFixed(2) + " °C"}<br>`;
      output += `ความชื้นสัมพัทธ์: ${RH.toFixed(2)} %<br>`;
      output += `จุด Dew Point: ${tempUnit === "F" ? cToF(DewPoint).toFixed(2) + " °F" : DewPoint.toFixed(2) + " °C"}`;
    } else if (!isNaN(DewPoint) && !isNaN(RH) && isNaN(T)) {
      T = calcTemp(DewPoint, RH);
      output += `จุด Dew Point: ${tempUnit === "F" ? cToF(DewPoint).toFixed(2) + " °F" : DewPoint.toFixed(2) + " °C"}<br>`;
      output += `ความชื้นสัมพัทธ์: ${RH.toFixed(2)} %<br>`;
      output += `อุณหภูมิ: ${tempUnit === "F" ? cToF(T).toFixed(2) + " °F" : T.toFixed(2) + " °C"}`;
    } else if (!isNaN(T) && !isNaN(DewPoint) && isNaN(RH)) {
      const rhCalc = calcRH(T, DewPoint);
      output += `อุณหภูมิ: ${tempUnit === "F" ? cToF(T).toFixed(2) + " °F" : T.toFixed(2) + " °C"}<br>`;
      output += `จุด Dew Point: ${tempUnit === "F" ? cToF(DewPoint).toFixed(2) + " °F" : DewPoint.toFixed(2) + " °C"}<br>`;
      output += `ความชื้นสัมพัทธ์: ${rhCalc.toFixed(2)} %`;
    } else {
      output = "กรุณาใส่ค่าแค่ 2 ค่า เพื่อคำนวณค่าอีกตัว";
    }
  } catch (err) {
    output = "เกิดข้อผิดพลาดในการคำนวณ: " + err.message;
  }

  resultDew.style.display = "block";
  resultDew.innerHTML = output;
});
