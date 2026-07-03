/* ============================================================
   Interactive Packet Journey — engine + learning widgets
   ------------------------------------------------------------
   หน้านี้เล่าเรื่อง "packet เดินทางอย่างไร" แบบ step-by-step
   โครงสร้างเป็น data-driven: แก้เนื้อเรื่องได้ที่ array STEPS
   ส่วนอื่น (subnet calc, Longest Prefix Match) เป็น widget แยกกันชัดเจน
   ============================================================ */
(function () {
  "use strict";

  /* MAC ย่อให้อ่านง่าย (ของจริง 48-bit) — จุดสำคัญคือ "MAC ของใคร" ไม่ใช่ค่าเป๊ะ */
  var MAC = {
    pcA: "aa:aa:0a",
    pcB: "bb:bb:14",
    r1:  "c1:c1:01",          // R1 ใช้ MAC ฟิสิคัลเดียวกันทั้งสอง subinterface (ROAS)
    bcast: "ff:ff:ff:ff:ff:ff"
  };
  var IP = {
    pcA: "192.168.10.10",
    pcB: "192.168.20.20",
    gw10: "192.168.10.1",
    gw20: "192.168.20.1"
  };

  /* ตำแหน่ง token บน SVG (viewBox 0 0 820 470) */
  var POS = {
    pcA: { x: 115, y: 84 },
    pcB: { x: 115, y: 386 },
    sw1: { x: 395, y: 235 },
    r1:  { x: 705, y: 235 },
    trunk10: { x: 550, y: 215 },
    trunk20: { x: 550, y: 255 }
  };

  /* ---------- บทเดินเรื่องหลัก ---------- */
  var STEPS = [
    {
      phase: "ออกเดินทาง",
      title: "PC-A อยากส่ง ping ไปหา PC-B",
      body: "<p>PC-A (ฝ่าย HR, VLAN 10) ต้องการ ping ไปยัง PC-B (ฝ่าย IT, VLAN 20) " +
            "โจทย์คือ frame/packet ต้องเดินทางผ่าน Switch และ Router กว่าจะถึงปลายทาง</p>" +
            "<p>กดปุ่ม <b>ถัดไป ▶</b> เพื่อเดินไปทีละขั้น แล้วสังเกต <b>Frame Inspector</b> ทางขวาว่าหัว frame เปลี่ยนอย่างไรในแต่ละ hop</p>",
      why: "แค่ <b>รู้ปลายทาง IP</b> ยังส่งไม่ได้ — ต้องรู้ว่า <b>ส่งให้ใครก่อน (MAC)</b> และ <b>ออกทางไหน</b>",
      nodes: ["pcA"], edges: [], pkt: POS.pcA, pktClass: "l3", tag: null,
      msg: "ยังไม่มี frame", focus: null,
      frame: { l2src: "—", l2dst: "—", vlan: "—", l3src: IP.pcA, l3dst: IP.pcB, ttl: "—" },
      changed: []
    },
    {
      phase: "ตัดสินใจ",
      title: "ปลายทางอยู่ 'ในวง' หรือ 'ข้ามวง' ?",
      body: "<p>PC-A เอา IP ตัวเองกับ subnet mask มา AND ได้ network <code>192.168.10.0/24</code> " +
            "แล้วเทียบกับปลายทาง <code>192.168.20.20</code> → คนละ network</p>" +
            "<p>ปลายทางข้ามวง → PC-A ต้องส่งให้ <b>Default Gateway</b> (<code>192.168.10.1</code>) ไม่ใช่ส่งตรงถึง PC-B</p>",
      why: "PC จะส่ง frame ตรงถึงปลายทางได้เฉพาะเมื่ออยู่ <b>วงเดียวกัน (Layer 2 เดียวกัน)</b> เท่านั้น ข้ามวงต้องพึ่ง Router เสมอ",
      nodes: ["pcA"], edges: [], pkt: POS.pcA, pktClass: "l3", tag: null,
      msg: "กำลังตัดสินใจปลายทาง", focus: null,
      frame: { l2src: "—", l2dst: "ต้องหา MAC ของ Gateway", vlan: "—", l3src: IP.pcA, l3dst: IP.pcB, ttl: "—" },
      changed: ["l2dst"]
    },
    {
      phase: "ARP",
      title: "ARP: ถามหา MAC ของ Gateway",
      body: "<p>PC-A รู้ IP ของ Gateway (192.168.10.1) แต่ยังไม่รู้ MAC ของมัน จึง <b>broadcast</b> ARP Request " +
            "ออกไปทั้ง VLAN 10 ว่า <i>“ใครคือ 192.168.10.1 ช่วยบอก MAC ที”</i></p>" +
            "<p>Switch รับ broadcast แล้วกระจายออกทุกพอร์ตใน VLAN 10 (รวมขา trunk ไป R1)</p>",
      why: "Ethernet ส่งด้วย <b>MAC</b> เท่านั้น ถ้าไม่รู้ MAC ปลายทางก็ประกอบ frame ไม่ได้ → ต้อง ARP ก่อน",
      nodes: ["pcA", "sw1"], edges: ["e-a"], pkt: POS.sw1, pktClass: "arp", tag: null,
      msg: "ARP Request (broadcast)", focus: "arp",
      frame: { l2src: MAC.pcA, l2dst: MAC.bcast, vlan: "10", l3src: "ARP: who has " + IP.gw10 + "?", l3dst: "—", ttl: "—" },
      changed: ["l2src", "l2dst", "vlan", "l3src"]
    },
    {
      phase: "ARP",
      title: "Gateway ตอบ แล้ว PC-A จำไว้ใน ARP cache",
      body: "<p>R1 เห็นว่า 192.168.10.1 คือ IP ของตัวเอง จึงตอบ ARP Reply กลับมาว่า MAC ของฉันคือ <code>" + MAC.r1 + "</code></p>" +
            "<p>PC-A บันทึกลง <b>ARP table</b>: <code>192.168.10.1 → " + MAC.r1 + "</code> ครั้งต่อไปไม่ต้องถามซ้ำ</p>",
      why: "ARP cache ช่วยไม่ให้ต้อง broadcast ทุกครั้ง — ถ้า cache หมดอายุหรือถูกล้าง ก็จะเห็น ARP วิ่งใหม่",
      nodes: ["pcA", "r1"], edges: ["e-a"], pkt: POS.pcA, pktClass: "arp", tag: null,
      msg: "ARP Reply → เก็บลง cache", focus: "arp",
      frame: { l2src: MAC.r1, l2dst: MAC.pcA, vlan: "10", l3src: "ARP reply: " + IP.gw10 + " = " + MAC.r1, l3dst: "—", ttl: "—" },
      changed: ["l2src", "l2dst", "l3src"]
    },
    {
      phase: "สร้าง Frame",
      title: "ประกอบ Ethernet Frame ห่อ ICMP Echo",
      body: "<p>ตอนนี้ PC-A มีครบแล้ว จึงห่อ ICMP Echo Request ใส่ frame:</p>" +
            "<p>• <b>MAC ปลายทาง = Gateway (" + MAC.r1 + ")</b> ไม่ใช่ MAC ของ PC-B<br>" +
            "• <b>IP ปลายทาง = PC-B (" + IP.pcB + ")</b> คือปลายทางจริงที่ไม่เปลี่ยน</p>",
      why: "จุดชี้เป็นชี้ตายของ networking: <b>MAC = 'hop ถัดไป'</b> (ระยะสั้น) ส่วน <b>IP = 'ปลายทางสุดท้าย'</b> (ระยะไกล)",
      nodes: ["pcA"], edges: [], pkt: POS.pcA, pktClass: "l3", tag: null,
      msg: "ICMP Echo Request", focus: null,
      frame: { l2src: MAC.pcA, l2dst: MAC.r1, vlan: "untagged", l3src: IP.pcA, l3dst: IP.pcB, ttl: "128" },
      changed: ["l2src", "l2dst", "l3src", "l3dst", "ttl", "vlan"]
    },
    {
      phase: "Layer 2 Switch",
      title: "SW1 หา MAC ในตาราง แล้วใส่ VLAN tag",
      body: "<p>SW1 รับ frame ที่ access port (VLAN 10) อ่าน MAC ปลายทาง <code>" + MAC.r1 + "</code> " +
            "เปิด <b>MAC Address Table</b> เจอว่าอยู่ทางพอร์ต trunk</p>" +
            "<p>ก่อนส่งออก trunk ไป R1 → SW1 <b>ติดแท็ก 802.1Q VLAN 10</b> เพื่อบอกปลายทางว่า frame นี้เป็นของ VLAN ไหน</p>",
      why: "trunk แบกหลาย VLAN ในสายเดียว จึงต้องมี tag กำกับ ไม่งั้น R1 จะไม่รู้ว่า frame นี้ควรเข้าซับอินเทอร์เฟซไหน",
      nodes: ["sw1"], edges: ["e-a", "e-t"], pkt: POS.trunk10, pktClass: "l3 v10", tag: "VLAN 10",
      msg: "ICMP Echo Request", focus: "mac",
      frame: { l2src: MAC.pcA, l2dst: MAC.r1, vlan: "10 (tagged)", l3src: IP.pcA, l3dst: IP.pcB, ttl: "128" },
      changed: ["vlan"]
    },
    {
      phase: "Layer 3 Routing",
      title: "R1 ตัดสินใจเส้นทางด้วย Longest Prefix Match",
      body: "<p>R1 แกะแท็กออก อ่าน <b>IP ปลายทาง 192.168.20.20</b> แล้วเปิด <b>Routing Table</b></p>" +
            "<p>มีหลายเส้นทางที่ครอบคลุมได้ แต่ R1 เลือก <code>192.168.20.0/24</code> (connected ที่ G0/0.20) " +
            "เพราะเป็น prefix ที่ <b>ยาว/เจาะจงที่สุด</b> — นี่คือกฎ Longest Prefix Match</p>",
      why: "Router เก็บได้หลาย route ที่ทับซ้อนกัน กฎ LPM ตัดสินให้เลือก 'เส้นที่ตรงที่สุด' เสมอ เพื่อให้ผลลัพธ์เดียวไม่กำกวม",
      nodes: ["r1"], edges: [], pkt: POS.r1, pktClass: "l3", tag: null,
      msg: "ICMP Echo Request", focus: "route",
      frame: { l2src: MAC.pcA, l2dst: MAC.r1, vlan: "แกะ tag แล้ว", l3src: IP.pcA, l3dst: IP.pcB, ttl: "128" },
      changed: ["vlan"]
    },
    {
      phase: "Rewrite + ARP",
      title: "R1 เขียนหัว Layer 2 ใหม่ (และ ARP หา PC-B)",
      body: "<p>ก่อนส่งออก VLAN 20 R1 ต้องรู้ MAC ของ PC-B → ARP หา แล้วได้ <code>" + MAC.pcB + "</code></p>" +
            "<p>R1 <b>เขียนหัว Ethernet ใหม่ทั้งคู่</b>: ต้นทาง = R1 (" + MAC.r1 + "), ปลายทาง = PC-B (" + MAC.pcB + ") " +
            "ส่วน <b>IP ต้นทาง/ปลายทางไม่แตะเลย</b> และลด <b>TTL 128 → 127</b></p>",
      why: "หัวใจของ Layer 2 vs Layer 3: ทุก hop ที่ผ่าน Router <b>MAC เปลี่ยนใหม่หมด</b> แต่ <b>IP คงเดิม end-to-end</b> ส่วน TTL ลดลง 1 ทุก hop กันวนไม่รู้จบ",
      nodes: ["r1", "pcB"], edges: ["e-t", "e-b"], pkt: POS.r1, pktClass: "l3", tag: null,
      msg: "ICMP Echo Request", focus: "arp",
      frame: { l2src: MAC.r1, l2dst: MAC.pcB, vlan: "20", l3src: IP.pcA, l3dst: IP.pcB, ttl: "127" },
      changed: ["l2src", "l2dst", "vlan", "ttl"]
    },
    {
      phase: "ส่งถึงปลายทาง",
      title: "ผ่าน trunk (VLAN 20) → SW1 → ถึง PC-B",
      body: "<p>R1 ส่ง frame ออก trunk โดยติดแท็ก VLAN 20, SW1 รับมา เปิด MAC table เจอ PC-B ที่ access port " +
            "จึง <b>แกะแท็กออก</b> แล้วส่ง frame ล้วน ๆ เข้า PC-B</p>" +
            "<p>PC-B ได้รับ ICMP Echo Request สำเร็จ 🎉</p>",
      why: "access port ส่งให้เครื่องผู้ใช้ต้องเป็น frame ที่ 'ไม่มี tag' เพราะ NIC ทั่วไปไม่เข้าใจ 802.1Q",
      nodes: ["sw1", "pcB"], edges: ["e-t", "e-b"], pkt: POS.pcB, pktClass: "l3 v20", tag: "VLAN 20",
      msg: "ICMP Echo Request", focus: "mac",
      frame: { l2src: MAC.r1, l2dst: MAC.pcB, vlan: "20 → untagged", l3src: IP.pcA, l3dst: IP.pcB, ttl: "127" },
      changed: ["vlan"]
    },
    {
      phase: "ขากลับ",
      title: "PC-B ตอบกลับ — เส้นทางเดินย้อนแบบเดียวกัน",
      body: "<p>PC-B สร้าง ICMP <b>Echo Reply</b> โดยสลับ IP: ต้นทาง = PC-B, ปลายทาง = PC-A " +
            "แล้วส่งให้ Gateway ของฝั่งตัวเอง (192.168.20.1) วิ่งย้อนกระบวนการทั้งหมดกลับไป</p>" +
            "<p>ping จะสำเร็จก็ต่อเมื่อ <b>ทั้งขาไปและขากลับ</b> มีเส้นทางครบ</p>",
      why: "อาการคลาสสิก “ping ไม่กลับ” ส่วนใหญ่ไม่ใช่ขาไปพัง แต่คือ <b>ขากลับไม่มี route</b> หรือ ARP/gateway ฝั่งตอบผิด",
      nodes: ["pcB"], edges: ["e-b", "e-t"], pkt: POS.pcB, pktClass: "reply", tag: null,
      msg: "ICMP Echo Reply", focus: null,
      frame: { l2src: MAC.pcB, l2dst: MAC.r1, vlan: "20", l3src: IP.pcB, l3dst: IP.pcA, ttl: "128" },
      changed: ["l2src", "l2dst", "l3src", "l3dst", "ttl", "vlan"]
    }
  ];

  /* ---------- Frame Inspector: นิยาม field ---------- */
  var FIELDS = [
    { k: "l2src", label: "MAC ต้นทาง", layer: "l2" },
    { k: "l2dst", label: "MAC ปลายทาง", layer: "l2" },
    { k: "vlan",  label: "VLAN tag",   layer: "l2" },
    { k: "l3src", label: "IP ต้นทาง",  layer: "l3" },
    { k: "l3dst", label: "IP ปลายทาง", layer: "l3" },
    { k: "ttl",   label: "TTL",         layer: "l3" }
  ];

  /* ============================================================
     Journey engine
     ============================================================ */
  function initJourney() {
    var root = document.getElementById("journey");
    if (!root) return;

    var svg = document.getElementById("stage-svg");
    var pkt = document.getElementById("pkt");
    var pktTag = document.getElementById("pkt-tag");
    var pktTagText = document.getElementById("pkt-tag-text");
    var nrStep = document.getElementById("nr-step");
    var nrTitle = document.getElementById("nr-title");
    var nrBody = document.getElementById("nr-body");
    var nrWhy = document.getElementById("nr-why");
    var insMsg = document.getElementById("ins-msg");
    var rowsBox = document.getElementById("frame-rows");
    var stepCount = document.getElementById("step-count");
    var dotsBox = document.getElementById("step-dots");
    var btnPrev = document.getElementById("btn-prev");
    var btnNext = document.getElementById("btn-next");
    var btnPlay = document.getElementById("btn-play");
    var btnRestart = document.getElementById("btn-restart");
    var focusChips = {
      arp: document.getElementById("tf-arp"),
      mac: document.getElementById("tf-mac"),
      route: document.getElementById("tf-route")
    };

    /* สร้างแถว Frame Inspector ครั้งเดียว แล้วเก็บ reference ไว้อัปเดต (ให้ transition ทำงาน) */
    var rowRefs = {};
    FIELDS.forEach(function (f) {
      var row = document.createElement("div");
      row.className = "frame-row " + f.layer;
      var k = document.createElement("span");
      k.className = "fr-k"; k.textContent = f.label;
      var v = document.createElement("span");
      v.className = "fr-v"; v.textContent = "—";
      row.appendChild(k); row.appendChild(v);
      rowsBox.appendChild(row);
      rowRefs[f.k] = { row: row, val: v };
    });

    /* สร้างปุ่มจุด step */
    var dots = [];
    STEPS.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = String(i);
      b.setAttribute("aria-label", "ไปขั้นที่ " + i);
      b.addEventListener("click", function () { stopPlay(); go(i); });
      dotsBox.appendChild(b);
      dots.push(b);
    });

    var idx = 0;
    var maxVisited = 0;
    var playing = false;
    var timer = null;

    function render(i) {
      var s = STEPS[i];

      /* narration */
      nrStep.textContent = "ขั้นที่ " + i + " / " + (STEPS.length - 1) + " · " + s.phase;
      nrTitle.textContent = s.title;
      nrBody.innerHTML = s.body;
      nrWhy.innerHTML = "<b>ทำไม:</b> " + s.why;

      /* frame inspector */
      insMsg.textContent = s.msg;
      FIELDS.forEach(function (f) {
        var ref = rowRefs[f.k];
        ref.val.textContent = s.frame[f.k];
        ref.row.classList.toggle("changed", s.changed.indexOf(f.k) !== -1);
      });

      /* table focus chips */
      Object.keys(focusChips).forEach(function (key) {
        if (focusChips[key]) focusChips[key].classList.toggle("on", s.focus === key);
      });

      /* nodes */
      ["pcA", "pcB", "sw1", "r1"].forEach(function (n) {
        var el = document.getElementById("n-" + n);
        if (el) el.classList.toggle("active", s.nodes.indexOf(n) !== -1);
      });

      /* edges */
      ["e-a", "e-b", "e-t"].forEach(function (e) {
        var el = document.getElementById(e);
        if (el) {
          var on = s.edges.indexOf(e) !== -1;
          el.classList.toggle("active", on);
          el.classList.toggle("flow", on);
        }
      });

      /* packet token: ตำแหน่ง + สี + tag */
      pkt.setAttribute("transform", "translate(" + s.pkt.x + "," + s.pkt.y + ")");
      pkt.setAttribute("class", "pkt " + s.pktClass);
      if (s.tag) {
        pktTag.style.display = "";
        pktTagText.textContent = s.tag;
      } else {
        pktTag.style.display = "none";
      }

      /* controls state */
      stepCount.textContent = i + " / " + (STEPS.length - 1);
      btnPrev.disabled = i === 0;
      btnNext.disabled = i === STEPS.length - 1;
      maxVisited = Math.max(maxVisited, i);
      dots.forEach(function (b, di) {
        b.classList.toggle("current", di === i);
        b.classList.toggle("visited", di < i || di <= maxVisited);
      });
    }

    function go(i) {
      idx = Math.max(0, Math.min(STEPS.length - 1, i));
      render(idx);
    }

    function next() { if (idx < STEPS.length - 1) go(idx + 1); }
    function prev() { if (idx > 0) go(idx - 1); }

    /* ---------- autoplay ---------- */
    function setPlayLabel() { btnPlay.textContent = playing ? "⏸ หยุด" : "▶ เล่นอัตโนมัติ"; }
    function stopPlay() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      setPlayLabel();
    }
    function startPlay() {
      if (idx === STEPS.length - 1) go(0);
      playing = true;
      setPlayLabel();
      timer = setInterval(function () {
        if (idx >= STEPS.length - 1) { stopPlay(); return; }
        next();
      }, 2600);
    }

    btnNext.addEventListener("click", function () { stopPlay(); next(); });
    btnPrev.addEventListener("click", function () { stopPlay(); prev(); });
    btnRestart.addEventListener("click", function () { stopPlay(); go(0); });
    btnPlay.addEventListener("click", function () { playing ? stopPlay() : startPlay(); });

    /* ลูกศรซ้าย/ขวา เมื่อ focus อยู่ในบล็อกนี้ (ไม่รบกวนการเลื่อนหน้า) */
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); stopPlay(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stopPlay(); prev(); }
    });

    go(0);
  }

  /* ============================================================
     Subnet decision mini-calculator (Step 1)
     ============================================================ */
  function ipToInt(ip) {
    var p = ip.split(".");
    if (p.length !== 4) return null;
    var n = 0;
    for (var i = 0; i < 4; i++) {
      var o = parseInt(p[i], 10);
      if (isNaN(o) || o < 0 || o > 255) return null;
      n = (n * 256) + o;
    }
    return n >>> 0;
  }
  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }
  function prefixToMask(p) { return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; }

  function initSubnetCalc() {
    var box = document.getElementById("subnet-calc");
    if (!box) return;
    // ใช้ data-a / data-b (ไม่ตั้งชื่อ attribute ลงท้าย src/href กัน CI link-checker จับผิด)
    var presets = box.querySelectorAll("[data-a]");
    var out = document.getElementById("sn-out");
    var verdict = document.getElementById("sn-verdict");

    function run(btn) {
      var src = btn.getAttribute("data-a");
      var dst = btn.getAttribute("data-b");
      var pfx = parseInt(btn.getAttribute("data-mask"), 10);
      var note = btn.getAttribute("data-note") || "";

      var mask = prefixToMask(pfx);
      var srcNet = (ipToInt(src) & mask) >>> 0;
      var dstNet = (ipToInt(dst) & mask) >>> 0;
      var same = srcNet === dstNet;

      out.innerHTML =
        row("IP ต้นทาง", src + " /" + pfx) +
        row("network ต้นทาง", intToIp(srcNet) + " /" + pfx) +
        row("IP ปลายทาง", dst) +
        row("network ปลายทาง", intToIp(dstNet) + " /" + pfx);

      verdict.className = "sc-verdict " + (same ? "same" : "diff");
      verdict.innerHTML = (same
        ? "🟢 <b>วงเดียวกัน</b> → PC-A ส่ง frame ตรงถึงปลายทาง (ARP หา MAC ของปลายทางเอง)"
        : "🟠 <b>คนละวง</b> → PC-A ต้องส่งให้ Default Gateway ก่อน (ARP หา MAC ของ Gateway)") +
        (note ? "<br><span style=\"font-weight:500\">" + note + "</span>" : "");

      presets.forEach(function (b) { b.classList.toggle("active", b === btn); });
    }
    function row(k, v) {
      return '<div class="sc-row"><span class="k">' + k + '</span><span>' + v + "</span></div>";
    }

    presets.forEach(function (b) { b.addEventListener("click", function () { run(b); }); });
    run(presets[0]);
  }

  /* ============================================================
     Longest Prefix Match widget (Step 5)
     ============================================================ */
  function initLPM() {
    var box = document.getElementById("lpm");
    if (!box) return;
    var rows = Array.prototype.slice.call(box.querySelectorAll("tr[data-cidr]"));
    var dests = box.querySelectorAll("[data-ip]");
    var explain = document.getElementById("lpm-explain");

    function matchLen(ip, cidr) {
      var parts = cidr.split("/");
      var pfx = parseInt(parts[1], 10);
      var mask = prefixToMask(pfx);
      var net = ipToInt(parts[0]) >>> 0;
      return ((ipToInt(ip) & mask) >>> 0) === net ? pfx : -1;
    }

    function run(btn) {
      var ip = btn.getAttribute("data-ip");
      var best = -1, bestRow = null, count = 0;

      rows.forEach(function (r) {
        var len = matchLen(ip, r.getAttribute("data-cidr"));
        var hit = len >= 0;
        r.classList.toggle("candidate", hit);
        r.classList.remove("win");
        var badge = r.querySelector(".win-badge");
        if (badge) badge.remove();
        var mcell = r.querySelector(".match");
        if (mcell) mcell.innerHTML = hit
          ? '<span style="color:var(--accent);font-weight:700">ตรง /' + len + "</span>"
          : '<span class="miss">ไม่ตรง</span>';
        if (hit) { count++; if (len > best) { best = len; bestRow = r; } }
      });

      if (bestRow) {
        bestRow.classList.remove("candidate");
        bestRow.classList.add("win");
        var td = bestRow.querySelector("td");
        var badge = document.createElement("span");
        badge.className = "win-badge";
        badge.textContent = "R1 เลือกเส้นนี้";
        td.appendChild(badge);
        var winCidr = bestRow.getAttribute("data-cidr");
        var via = bestRow.getAttribute("data-via") || "";
        explain.innerHTML = "ปลายทาง <code>" + ip + "</code> เข้าเงื่อนไข <b>" + count + " เส้นทาง</b> " +
          "แต่ R1 เลือก <code>" + winCidr + "</code> " + via +
          " เพราะ prefix ยาวที่สุด (/" + best + ") = <b>เจาะจงที่สุด</b> ตามกฎ Longest Prefix Match";
      } else {
        explain.innerHTML = "ปลายทาง <code>" + ip + "</code> ไม่ตรงเส้นทางใดเลย → ถ้าไม่มี default route จะถูก <b>drop</b>";
      }

      dests.forEach(function (b) { b.classList.toggle("active", b === btn); });
    }

    dests.forEach(function (b) { b.addEventListener("click", function () { run(b); }); });
    run(dests[0]);
  }

  /* honor reduced-motion */
  function initReducedMotion() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("reduce-motion");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReducedMotion();
    initJourney();
    initSubnetCalc();
    initLPM();
  });
})();
