document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  //  ZIP DROPZONE
  // ============================================================
  const zipDropzone = document.getElementById('zipDropzone');
  const zipInput    = document.getElementById('zipInput');
  const zipFileInfo = document.getElementById('zipFileInfo');
  const zipFileName = document.getElementById('zipFileName');

  function setZipFile(file) {
    if (!file) return;
    zipFileName.textContent = file.name;
    zipFileInfo.hidden = false;
    zipDropzone.classList.add('dropzone--has-file');
  }

  zipInput.addEventListener('change', () => setZipFile(zipInput.files[0]));

  zipDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zipDropzone.classList.add('dropzone--drag');
  });

  zipDropzone.addEventListener('dragleave', () => {
    zipDropzone.classList.remove('dropzone--drag');
  });

  zipDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    zipDropzone.classList.remove('dropzone--drag');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      zipInput.files = dt.files;
      setZipFile(file);
    }
  });


  // ============================================================
  //  IMAGE UPLOAD INPUTS
  // ============================================================
  function bindImageInput(inputId, nameId) {
    const input  = document.getElementById(inputId);
    const nameEl = document.getElementById(nameId);
    if (!input || !nameEl) return;

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        nameEl.textContent   = file.name;
        nameEl.style.display = 'block';
      }
    });
  }

  bindImageInput('schoolLogo', 'schoolLogoName');
  bindImageInput('umlImage',   'umlImageName');
  bindImageInput('flowImage',  'flowImageName');


  // ============================================================
  //  HELPERS
  // ============================================================
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function getImageType(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const map = { jpg: 'jpg', jpeg: 'jpg', png: 'png', gif: 'gif', bmp: 'bmp', svg: 'svg' };
    return map[ext] || 'png';
  }

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 150, height: 150 }); };
      img.src = url;
    });
  }

  // שמירת יחס גובה-רוחב בתוך טווח [minPx, maxPx]
  function clampedDimensions(naturalW, naturalH, minPx, maxPx) {
    let w = naturalW;
    let h = naturalH;
    if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
    if (w < minPx) { h = Math.round(h * minPx / w); w = minPx; }
    return { width: w, height: h };
  }


  // ============================================================
  //  GENERATE BUTTON
  // ============================================================
  const generateBtn = document.getElementById('generateBtn');
  if (!generateBtn) { console.error('generateBtn לא נמצא'); return; }

  generateBtn.addEventListener('click', async () => {
    if (typeof window.docx === 'undefined') { alert('ספריית docx לא נטענה.'); return; }
    if (typeof JSZip === 'undefined')        { alert('ספריית JSZip לא נטענה.'); return; }
    if (typeof window.analyzeZip === 'undefined') { alert('analyzer.js לא נטען.'); return; }

    const {
      Document, Packer, Paragraph, TextRun,
      Header, Footer, AlignmentType, PageNumber, ImageRun,
      DocumentDefaults,
      TableOfContents, HeadingLevel, PageBreak,
      Table, TableRow, TableCell, WidthType, BorderStyle,
      ShadingType, VerticalAlign,
      SectionType, PageOrientation, ExternalHyperlink
    } = window.docx;

    const btnLabel = generateBtn.querySelector('span');
    generateBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'מנתח פרויקט...';

    try {

      // ── קריאת שדות הטופס ────────────────────────────────────
      const schoolName  = (document.getElementById('schoolName').value  || '').trim();
      const projectName = (document.getElementById('projectName').value || '').trim();
      const studentName = (document.getElementById('studentName').value || '').trim();
      const studentId   = (document.getElementById('studentId').value   || '').trim();
      const teacherName  = (document.getElementById('teacherName').value || '').trim();
      const flowUrl      = (document.getElementById('flowUrl').value  || '').trim();
      const umlUrl       = (document.getElementById('umlUrl').value   || '').trim();
      const flowImageFile = document.getElementById('flowImage').files[0] || null;
      const umlImageFile  = document.getElementById('umlImage').files[0]  || null;

      // ── צבע כותרת הטבלה ──────────────────────────────────
      const pickedColor = (() => {
        const checked = document.querySelector('input[name="tableColor"]:checked');
        return checked ? checked.value : 'DBEAFE';
      })();

      const pickedFont = (() => {
        const checked = document.querySelector('input[name="tableFont"]:checked');
        return checked ? checked.value : 'Arial';
      })();

      // ── ניתוח ZIP ───────────────────────────────────────────
      const zipFile = document.getElementById('zipInput').files[0];
      let analysisResults = [];
      let screenOrder      = [];
      let codeStructure    = { grouped: {}, order: [] };
      let resources        = { layouts: [], drawables: [], values: [] };
      if (zipFile) {
        if (btnLabel) btnLabel.textContent = 'מנתח קוד...';
        analysisResults = await window.analyzeZip(zipFile);
        if (btnLabel) btnLabel.textContent = 'מנתח מסכים...';
        screenOrder = await window.analyzeScreenOrder(zipFile);
        if (btnLabel) btnLabel.textContent = 'מנתח מבנה...';
        codeStructure = await window.analyzeCodeStructure(zipFile);
        if (btnLabel) btnLabel.textContent = 'קורא קבצי משאבים...';
        resources = await window.analyzeResources(zipFile);
      }

      // ── לוגו בית הספר ───────────────────────────────────────
      const logoFile   = document.getElementById('schoolLogo').files[0];
      let logoChildren = [];
      if (logoFile) {
        const logoBuffer = await readFileAsArrayBuffer(logoFile);
        const logoType   = getImageType(logoFile);
        const logoDims   = await getImageDimensions(logoFile);
        const scaled     = clampedDimensions(logoDims.width, logoDims.height, 80, 200);
        logoChildren = [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2880, after: 400 },
            children: [
              new ImageRun({
                type: logoType, data: logoBuffer,
                transformation: { width: scaled.width, height: scaled.height },
                altText: { title: 'לוגו', description: 'לוגו', name: 'logo' }
              })
            ]
          })
        ];
      }

      // ── עזר: פסקה RTL ───────────────────────────────────────
      const rtlPara = (text, opts = {}) => new Paragraph({
        alignment: opts.alignment || AlignmentType.CENTER,
        bidirectional: true,
        spacing: opts.spacing || { before: 0, after: 120 },
        children: [ new TextRun({
          text, font: 'Arial', size: opts.size || 24,
          bold: !!opts.bold, rightToLeft: true,
          underline: opts.underline ? { type: 'single' } : undefined,
        }) ]
      });

      // ── עזר: בנה שורת טבלה ──────────────────────────────────
      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
      const borders    = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
      const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

      const makeCell = (text, widthDXA, opts = {}) => {
        const shading = opts.header
          ? { fill: pickedColor, type: ShadingType.CLEAR }
          : { fill: 'FFFFFF', type: ShadingType.CLEAR };

        const isClasses = opts.colType === 'classes';
        const alignment = opts.header
          ? AlignmentType.CENTER
          : opts.colType === 'section'
            ? AlignmentType.CENTER
            : opts.colType === 'desc'
              ? AlignmentType.CENTER
              : AlignmentType.LEFT;

        // עמודת מחלקות: כל שם בשורה נפרדת, LTR
        const cellChildren = isClasses && !opts.header
          ? text.split('\n').map(line => new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [ new TextRun({
                text: line, font: pickedFont, size: 24,
                bold: false, color: '000000',
              }) ]
            }))
          : [ new Paragraph({
              bidirectional: opts.colType !== 'section',
              alignment,
              children: [ new TextRun({
                text, font: pickedFont, size: 24,
                bold: !!opts.header, color: '000000',
                rightToLeft: opts.colType === 'desc' || opts.colType === 'section',
              }) ]
            }) ];

        return new TableCell({
          borders,
          width: { size: widthDXA, type: WidthType.DXA },
          margins: cellMargins,
          shading,
          verticalAlign: VerticalAlign.CENTER,
          children: cellChildren,
        });
      };

      // ── בניית שורות הטבלה ───────────────────────────────────
      const tableRows = [];

      // שורת כותרת
      tableRows.push(new TableRow({
        tableHeader: true,
        children: [
          makeCell('מחלקות ממשות', 3426, { header: true, colType: 'classes'  }),
          makeCell('תיאור הדרישה', 4800, { header: true, colType: 'desc'     }),
          makeCell('סעיף',         1200, { header: true, colType: 'section'  }),
        ]
      }));

      // שורות נתונים — רק סעיפים שנמצאו
      for (const { req, found, classes } of analysisResults) {
        if (!found) continue;
        // הוסף סיומת לכל קובץ והפרד בירידת שורה
        const classText = classes
          .map(c => c.endsWith('.java') || c.endsWith('.kt') ? c : c + '.java')
          .join('\n');
        tableRows.push(new TableRow({
          children: [
            makeCell(classText,       3426, { colType: 'classes' }),
            makeCell(req.description, 4800, { colType: 'desc'    }),
            makeCell(req.sub,         1200, { colType: 'section' }),
          ]
        }));
      }

      const requirementsTable = new Table({
        width: { size: 9426, type: WidthType.DXA },
        columnWidths: [3426, 4800, 1200],
        rows: tableRows,
      });


      // ── עוזר: כותרת 2 ────────────────────────────────────
      const makeH2 = (text) => new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        outlineLevel: 1,
        spacing: { before: 240, after: 300 },
        children: [ new TextRun({
          text, font: pickedFont, size: 32, bold: true, italics: true, rightToLeft: true,
        }) ]
      });

      // ── עוזר: פסקת גוף RTL ───────────────────────────────
      const bodyPara = (text, opts = {}) => new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 160 },
        children: [ new TextRun({
          text, font: pickedFont, size: 24,
          bold: !!opts.bold, rightToLeft: true,
        }) ]
      });

      // ── עוזר: קישור לחיץ ──────────────────────────────────
      const makeLinkPara = (url) => new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 0, after: 200 },
        children: [ new ExternalHyperlink({
          link: url,
          children: [ new TextRun({
            text: url, font: pickedFont, size: 24,
            style: 'Hyperlink', rightToLeft: false,
          }) ]
        }) ]
      });

      // ── בניית טבלת מסכים ────────────────────────────────────
      const screenTableRows = [];

      // כותרת
      const sHdr = (text, w) => new TableCell({
        borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
        width: { size: w, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: { fill: pickedColor, type: ShadingType.CLEAR },
        children: [ new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          children: [ new TextRun({ text, font: pickedFont, size: 24, bold: true, color: '000000', rightToLeft: true }) ]
        }) ]
      });

      screenTableRows.push(new TableRow({
        tableHeader: true,
        children: [
          sHdr("מס'",          700),
          sHdr('תמונת מסך',    3000),
          sHdr('תיאור מסך',    3326),
          sHdr('שם המסך',      2400),
        ]
      }));

      // שורות נתונים
      const sCell = (text, w, align) => new TableCell({
        borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
        width: { size: w, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
        children: [ new Paragraph({
          alignment: align || AlignmentType.CENTER,
          bidirectional: align === AlignmentType.RIGHT,
          children: [ new TextRun({ text, font: pickedFont, size: 24, color: '000000',
            rightToLeft: align === AlignmentType.RIGHT }) ]
        }) ]
      });

      const displayScreens = screenOrder.length > 0 ? screenOrder : ['(לא הועלה ZIP)'];

      displayScreens.forEach((name, idx) => {
        screenTableRows.push(new TableRow({
          height: { value: 2200, rule: 'atLeast' },   // ~4cm לתמונה
          children: [
            sCell(name,            2400,  AlignmentType.RIGHT),    // שם המסך
            sCell('',              3326,  AlignmentType.RIGHT),    // תיאור — ריק למילוי ידני
            sCell('',              3000,  AlignmentType.CENTER),   // תמונת מסך — ריק להדבקה
            sCell(String(idx + 1),  700,  AlignmentType.CENTER),
          ]
        }));
      });

      const screensTable = new Table({
        width: { size: 9426, type: WidthType.DXA },
        columnWidths: [2400, 3326, 3000, 700],
        rows: screenTableRows,
      });


      // ── תמונת זרימה ─────────────────────────────────────
      let flowImgPara = null;
      if (flowImageFile) {
        const flowBuf  = await readFileAsArrayBuffer(flowImageFile);
        const flowType = getImageType(flowImageFile);
        const flowDims = await getImageDimensions(flowImageFile);
        // מקסימום 500px ברוחב לעמוד לאורך
        const fScaled  = clampedDimensions(flowDims.width, flowDims.height, 100, 500);
        flowImgPara = new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [ new ImageRun({
            type: flowType, data: flowBuf,
            transformation: { width: fScaled.width, height: fScaled.height },
            altText: { title: 'תרשים זרימה', description: 'זרימה', name: 'flow' }
          }) ]
        });
      }

      // ── תמונת UML (לעמוד לרוחב — מקסימום 700px) ─────────
      let umlImgPara = null;
      if (umlImageFile) {
        const umlBuf  = await readFileAsArrayBuffer(umlImageFile);
        const umlType = getImageType(umlImageFile);
        const umlDims = await getImageDimensions(umlImageFile);
        const uScaled = clampedDimensions(umlDims.width, umlDims.height, 100, 700);
        umlImgPara = new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [ new ImageRun({
            type: umlType, data: umlBuf,
            transformation: { width: uScaled.width, height: uScaled.height },
            altText: { title: 'UML', description: 'UML', name: 'uml' }
          }) ]
        });
      }

      // ── בניית תוכן מימוש הפרויקט ─────────────────────────────
      const CAT_LABELS = codeStructure.labels || window.CAT_LABELS_MAP || {};

      const implChildren = [];

      const cellBorderImpl = { style: BorderStyle.SINGLE, size: 1, color: 'BBBBBB' };
      const bordersImpl    = { top: cellBorderImpl, bottom: cellBorderImpl, left: cellBorderImpl, right: cellBorderImpl };
      const cellMargImpl   = { top: 60, bottom: 60, left: 100, right: 100 };

      // עוזר: תא רגיל בטבלת קוד
      const codeCell = (text, w, opts = {}) => new TableCell({
        borders: bordersImpl,
        width: { size: w, type: WidthType.DXA },
        margins: cellMargImpl,
        shading: { fill: opts.header ? pickedColor : 'FFFFFF', type: ShadingType.CLEAR },
        children: [ new Paragraph({
          bidirectional: opts.isDesc || false,
          alignment: opts.header
            ? AlignmentType.CENTER
            : opts.isDesc
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
          children: [ new TextRun({
            text,
            font: pickedFont,
            size: 24,
            bold: !!opts.header,
            color: '000000',
            rightToLeft: opts.isDesc || false,
          }) ]
        }) ]
      });

      // עוזר: כותרת 3
      const makeH3 = (text) => new Paragraph({
        heading: HeadingLevel.HEADING_3,
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 160 },
        children: [ new TextRun({
          text, font: pickedFont, size: 28, bold: true,
          underline: { type: 'single' }, rightToLeft: true,
        }) ]
      });

      // עוזר: שם קובץ (קו תחתון, שמאל, LTR)
      const makeFileName = (name) => new Paragraph({
        heading: HeadingLevel.HEADING_4,
        alignment: AlignmentType.LEFT,
        spacing: { before: 320, after: 80 },
        children: [ new TextRun({
          text: name + '.java', font: pickedFont, size: 24,
          bold: true, underline: { type: 'single' },
        }) ]
      });

      // עוזר: שורת "תיאור:" RTL
      const makeDesc = () => new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        spacing: { before: 60, after: 240 },
        children: [ new TextRun({ text: 'תיאור:', font: pickedFont, size: 24, bold: true, rightToLeft: true }) ]
      });

      // עוזר: כותרת מעל טבלה (italic, ממורכז)
      const makeTableTitle = (text) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [ new TextRun({ text, font: pickedFont, size: 24, italics: true }) ]
      });

      // עוזר: טבלת עצמים
      const makeFieldsTable = (fields) => {
        const rows = [
          new TableRow({ tableHeader: true, children: [
            codeCell('העצם',         5213, { header: true }),
            codeCell('תיאור / תפקיד', 4213, { header: true }),
          ]}),
          ...fields.map(f => new TableRow({ children: [
            codeCell(f,    5213),
            codeCell('',   4213),
          ]}))
        ];
        return new Table({ width: { size: 9426, type: WidthType.DXA }, columnWidths: [5213, 4213], rows });
      };

      // עוזר: טבלת פונקציות
      const makeMethodsTable = (methods) => {
        const rows = [
          new TableRow({ tableHeader: true, children: [
            codeCell('שם הפונקציה וחתימתה', 5213, { header: true }),
            codeCell('תיאור / תפקיד',       4213, { header: true }),
          ]}),
          ...methods.map(m => new TableRow({ children: [
            codeCell(m,    5213),
            codeCell('',   4213),
          ]}))
        ];
        return new Table({ width: { size: 9426, type: WidthType.DXA }, columnWidths: [5213, 4213], rows });
      };

      // בנה תוכן לפי קטגוריה
      for (const cat of codeStructure.order) {
        const files = codeStructure.grouped[cat];
        implChildren.push(makeH3(CAT_LABELS[cat] || cat));

        for (const file of files) {
          implChildren.push(makeFileName(file.name));
          implChildren.push(makeDesc());

          if (file.fields.length > 0) {
            implChildren.push(makeTableTitle('טבלת עצמים'));
            implChildren.push(makeFieldsTable(file.fields));
            implChildren.push(new Paragraph({ children: [] }));
          }

          if (file.methods.length > 0) {
            implChildren.push(makeTableTitle('פונקציות'));
            implChildren.push(makeMethodsTable(file.methods));
            implChildren.push(new Paragraph({ children: [] }));
          }
        }
      }

      // ── עוזר: כותרת 1 ───────────────────────────────────────
      const makeH1 = (text) => new Paragraph({
        heading: HeadingLevel.HEADING_1,
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        children: [ new TextRun({ text, font: pickedFont, rightToLeft: true }) ]
      });

      // ── עוזר: המרת טקסט קוד לפסקאות ───────────────────────────
      const codeTextToParagraphs = (text) => {
        if (!text) return [];
        return text.split('\n').map(line => new Paragraph({
          bidirectional: false,
          alignment: AlignmentType.LEFT,
          spacing: { before: 0, after: 0 },
          children: [ new TextRun({
            text: line || ' ',
            font: 'Courier New',
            size: 20,   // 10pt — קוד קומפקטי
            color: '1E1E1E',
          }) ]
        }));
      };

      // ── עוזר: כותרת קובץ בנספחים ────────────────────────────
      const appendixFileHeader = (filename, color) => new Paragraph({
        bidirectional: false,
        alignment: AlignmentType.LEFT,
        spacing: { before: 400, after: 120 },
        children: [ new TextRun({
          text: '━━━  ' + filename + '  ━━━',
          font: pickedFont, size: 24, bold: true,
          color: color || '0284C7',
        }) ]
      });

      // ── בניית קוד נספחים ─────────────────────────────────────
      const appendixChildren = [];

      // ── Java / Kotlin source files ───────────────────────────
      for (const cat of codeStructure.order) {
        const files = codeStructure.grouped[cat];
        appendixChildren.push(makeH3(CAT_LABELS[cat] || cat));

        for (const file of files) {
          appendixChildren.push(appendixFileHeader(file.name + '.java', '0284C7'));
          appendixChildren.push(...codeTextToParagraphs(file.rawText));
          appendixChildren.push(new Paragraph({ children: [] }));
        }
      }

      // ── Layout XML files ─────────────────────────────────────
      if (resources.layouts.length > 0) {
        appendixChildren.push(makeH3('קבצי Layout XML'));
        for (const res of resources.layouts) {
          appendixChildren.push(appendixFileHeader(res.name, '0EA5E9'));
          appendixChildren.push(...codeTextToParagraphs(res.text));
          appendixChildren.push(new Paragraph({ children: [] }));
        }
      }

      // ── Drawable XML files ───────────────────────────────────
      if (resources.drawables.length > 0) {
        appendixChildren.push(makeH3('קבצי Drawable XML'));
        for (const res of resources.drawables) {
          appendixChildren.push(appendixFileHeader(res.name, '7DD3FC'));
          appendixChildren.push(...codeTextToParagraphs(res.text));
          appendixChildren.push(new Paragraph({ children: [] }));
        }
      }

      // ── בניית המסמך ─────────────────────────────────────────
      if (btnLabel) btnLabel.textContent = 'בונה מסמך...';

      const headerPara = new Header({
        children: [ new Paragraph({
          alignment: AlignmentType.RIGHT, bidirectional: true,
          children: [ new TextRun({ text: 'בס״ד', font: 'Arial', size: 22, bold: true, rightToLeft: true }) ]
        }) ]
      });
      const footerPara = new Footer({
        children: [ new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'עמוד ', font: 'Arial', size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 20 }),
            new TextRun({ text: ' מתוך ', font: 'Arial', size: 20 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 20 }),
          ]
        }) ]
      });
      const sectionProps = {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
      };

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: { font: 'Arial', size: 24 },
            },
          },
          paragraphStyles: [

            {
              id: 'Heading1', name: 'Heading 1',
              basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { font: 'Arial', size: 40, bold: true, underline: { type: 'single' } },
              paragraph: { alignment: AlignmentType.CENTER, bidirectional: true, spacing: { before: 240, after: 240 }, outlineLevel: 0 }
            },
            {
              id: 'Heading2', name: 'Heading 2',
              basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 32, bold: true, italics: true, rightToLeft: true },
              paragraph: { alignment: AlignmentType.RIGHT, bidirectional: true, spacing: { before: 240, after: 300 }, outlineLevel: 1 }
            },
            {
              id: 'Heading3', name: 'Heading 3',
              basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 28, bold: true, underline: { type: 'single' }, rightToLeft: true },
              paragraph: { alignment: AlignmentType.CENTER, bidirectional: true, spacing: { before: 400, after: 160 }, outlineLevel: 2 }
            },
            {
              id: 'Heading4', name: 'Heading 4',
              basedOn: 'Normal', next: 'Normal', quickFormat: true,
              run: { size: 24, bold: true, underline: { type: 'single' } },
              paragraph: { alignment: AlignmentType.LEFT, spacing: { before: 320, after: 80 }, outlineLevel: 3 }
            }
          ]
        },
        settings: {
          evenAndOddHeaderAndFooters: false,
        },
        sections: [{
          properties: sectionProps,
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            // עמוד שער
            ...logoChildren,
            rtlPara('פרויקט גמר בהנדסת תוכנה', { bold: true, size: 24, spacing: { before: 400, after: 200 } }),
            rtlPara('חלופה - תכנון ותכנות מערכות בטלפונים ניידים תחת מערכת הפעלה Android.', { bold: true, size: 24, spacing: { before: 0, after: 600 } }),
            rtlPara('שם בית הספר: ' + schoolName,       { size: 24, spacing: { before: 200, after: 120 } }),
            rtlPara('שם הפרויקט: '  + projectName,      { size: 24 }),
            rtlPara('שם התלמיד: '   + studentName,      { size: 24 }),
            rtlPara('ת.ז התלמיד: '  + studentId,        { size: 24 }),
            rtlPara('שם המורה/המנחה: ' + teacherName,   { size: 24 }),
            rtlPara('תאריך הגשה: ',                     { size: 24 }),
            rtlPara('שנה עברית: ',                      { size: 24 }),

            // עמוד תוכן עניינים
            new Paragraph({ children: [new PageBreak()] }),
            rtlPara('תוכן עניינים', { bold: true, size: 40, spacing: { before: 0, after: 400 } }),
            new TableOfContents('תוכן עניינים', { hyperlink: true, headingStyleRange: '1-4' }),

            // מבוא
            new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, bidirectional: true,
              children: [ new TextRun({ text: 'מבוא', rightToLeft: true, font: 'Arial' }) ] }),

            // מענה לדרישות
            new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, bidirectional: true,
              children: [ new TextRun({ text: 'מענה לדרישות משרד החינוך לפרויקט 5 יח"ל בהנדסת תוכנה', rightToLeft: true, font: 'Arial' }) ] }),

            // טבלת הדרישות
            requirementsTable,

            // ── מעבר עמוד + כותרת מבנה/ארכיטקטורה ─────────
            new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, bidirectional: true,
              children: [ new TextRun({ text: 'מבנה/ארכיטקטורה', rightToLeft: true, font: pickedFont }) ]
            }),

            // ── כותרת 2: תכנון ותיעוד מסכי הפרויקט ─────────
            makeH2('תכנון ותיעוד מסכי הפרויקט'),

            // ── טבלת מסכים ───────────────────────────────────
            screensTable,
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 2 — תרשים זרימה (לאורך)
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
            }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH2('תרשים זרימה למסכי הפרויקט:'),

            ...(flowUrl ? [
              bodyPara('בכדי לראות את תרשים הזרימה בצורה יותר ברורה/נוחה הינה קישור שדרכו ניתן לראותו, אך בכל זאת צירפתי תמונה:'),
              makeLinkPara(flowUrl),
            ] : []),

            ...(flowImgPara ? [flowImgPara] : []),
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 3 — UML (לרוחב)
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: {
              size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
            }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH2('תיאור UML של המחלקות לרבות קשרים ביניהן:'),

            ...(umlUrl ? [
              bodyPara('בכדי לראות את תרשים ה-UML בצורה יותר ברורה/נוחה הינה קישור שדרכו ניתן לראותו, אך בכל זאת צירפתי תמונה:'),
              makeLinkPara(umlUrl),
            ] : []),

            ...(umlImgPara ? [umlImgPara] : []),
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 4 — מימוש הפרויקט (לאורך)
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH2('מימוש הפרויקט'),
            ...implChildren,
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 5 — מדריך למשתמש
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH1('מדריך למשתמש'),
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 6 — רפלקציה אישית
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH1('רפלקציה אישית'),
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 7 — ביבליוגרפיה
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH1('ביבליוגרפיה'),
            new Paragraph({
              bidirectional: false,
              alignment: AlignmentType.LEFT,
              spacing: { before: 200, after: 0 },
              children: [
                new ExternalHyperlink({
                  link: 'https://ctrl.shift-is.com/',
                  children: [ new TextRun({
                    text: 'ctrl.shift-is.com',
                    font: pickedFont, size: 24,
                    style: 'Hyperlink',
                  }) ]
                })
              ]
            }),
          ]
        },

        // ══════════════════════════════════════════════════
        //  SECTION 8 — נספחים (קוד המקור)
        // ══════════════════════════════════════════════════
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }
          },
          headers: { default: headerPara },
          footers: { default: footerPara },
          children: [
            makeH1('נספחים'),
            ...appendixChildren,
          ]
        },

      ]});

      const blob = await Packer.toBlob(doc);
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'project-book.docx';
      document.body.appendChild(link); link.click();
      link.remove(); URL.revokeObjectURL(url);

      console.log('DOCX נוצר בהצלחה');

    } catch (err) {
      console.error('שגיאה:', err);
      alert('אירעה שגיאה: ' + err.message);
    } finally {
      generateBtn.disabled = false;
      if (btnLabel) btnLabel.textContent = "ג'נרט ספר פרויקט";
    }
  });

}); // end DOMContentLoaded