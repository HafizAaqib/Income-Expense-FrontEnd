// const PagesToShow = ['income','expense','support','students','staff','graveyard'];

const clientConfigs = {
  "faizanehajveri.web.app": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Header_FullName: "جامع مسجد فیضانِ ہجویری",
    Header_Address: `سکین کالج والی گلی P-565، بلال روڈ ، 
            لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد`,
    Footer_Names: "مفتی نزاکت علی المدنی &nbsp;:&nbsp; 7812905-0306",
    PrintNotes:"آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔",
  PagesToShow:['income','expense','support','staff']
  },
  "jamiarabbani.web.app": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Footer_Names: `
      <div style="display: flex; gap: 20px; direction: rtl; justify-content:center">
      <div>علامہ محمد طیب صدیقی </br> 0300-9427139</div>
      <div>قاری محمد طاہر فاروقی </br> 0300-4286360</div>
      <div>علامہ سعید احمد عثمانی </br> 0321-4615565</div>
    </div>
    `,

    Entities: [
      {
        EntityId: 1, Name: ' جامع مسجد ربانی ',
        Header_FullName: "جامع مسجدربانی المعروف قاری غلام مصطفٰے (رحمۃ اللہ علیہ)",
        Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
        PrintNotes: `آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔`,
        PagesToShow:['income','expense','support','staff']
        
      },
      {
        EntityId: 2, Name: ' دارالعلوم بہارِ مدینہ گرلز',
        Header_FullName: 'دارالعلوم بہارِ مدینہ گرلز',
        Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
        PrintNotes: `آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مدرسے کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔`,
        PagesToShow:['income','expense','support','students','staff']
      },
      {
        EntityId: 3, Name: ' دارالعلوم بہارِ مدینہ بوائز',
        Header_FullName: 'دارالعلوم بہارِ مدینہ بوائز',
        Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
        PrintNotes: `آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مدرسے کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔`,
        PagesToShow:['income','expense','support','students','staff']
      },
      {
        EntityId: 4, Name: ' صوفی آباد نِشتر کالونی قبرستان',
        Header_FullName: ' صوفی آباد نِشتر کالونی قبرستان',
        Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
        PrintNotes: `آپ کی دی ہوئی رقم قبرستان کی ضروریات میں استعمال کی جائے گی۔`,
        PagesToShow:['income','expense','support','staff','graveyard']
      },
      {
        EntityId: 5, Name: ' میلاد فورس پاکستان',
        Header_FullName: 'میلاد فورس پاکستان',
        PrintNotes: `آپ کی دی ہوئی رقم میلاد شریف کے اخراجات کے لیے استعمال کی جائے گی۔`,
        PagesToShow:['income','expense','support']
      },
    ]
  },
  "localhost": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Header_FullName: "جامع مسجد فیضانِ ہجویری",
    Header_Address: `سکین کالج والی گلی P-565، بلال روڈ ، 
            لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد`,
    Footer_Names: "مفتی نزاکت علی المدنی &nbsp;:&nbsp; 7812905-0306",
    PrintNotes:"آپ کی عطیہ کردہ رقم کسی بھی جائز دینی، اصلاحی، تعمیری یا مسجد کی تزئین و آرائش کے کام میں استعمال کی جا سکتی ہے۔",
   PagesToShow : ['income','expense','support','students','staff']
  },
};

// Detect current hostname
const hostname = window.location.hostname;
export const CONFIG = clientConfigs[hostname] || clientConfigs["localhost"];


// firebase deploy --only hosting

