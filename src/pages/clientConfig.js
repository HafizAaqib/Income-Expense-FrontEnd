const clientConfigs = {
  "faizanehajveri.web.app": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Header_FullName: "جامع مسجد فیضانِ ہجویری",
    Header_Address: `سکین کالج والی گلی P-565، بلال روڈ ، 
            لنک ویسٹ کینال روڈ، امین ٹاؤن، فیصل آباد`,
    Footer_Names: "مفتی نزاکت علی المدنی &nbsp;:&nbsp; 7812905-0306",
  },
  "jamiarabbani.web.app": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Header_FullName: "جامع مسجدربانی المعروف قاری غلام مصطفٰے (رحمۃ اللہ علیہ)",
    Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
    Footer_Names: `
    <div style="display: flex; gap: 20px; direction: rtl; justify-content:center">
  <div>علامہ محمد طیب صدیقی </br> 0300-9427139</div>
  <div>قاری محمد طاہر فاروقی </br> 0300-4286360</div>
  <div>علامہ سعید احمد عثمانی </br> 0321-4615565</div>
</div>
`,

    Entities :[
    {EntityId: 1 , Name : 'جامع  مسجد  ربانی' },
    {EntityId: 2 , Name : 'دارالعلوم  بہارِ  مدینہ' },
    {EntityId: 3 , Name : 'نِشتر  قبرستان' },
    ]
  },
  "localhost": {
    CLOUD_NAME: "drinjgbm5",
    UPLOAD_PRESET: "FaizaneHajveriImages",
    Header_FullName: "جامع مسجدربانی المعروف قاری غلام مصطفٰے (رحمۃ اللہ علیہ)",
    Header_Address: `ایڈریس : نواں پنڈ اٹاری صوفی آباد لاہور`,
    Footer_Names: `
    <div style="display: flex; gap: 20px; direction: rtl; justify-content:center">
  <div>علامہ محمد طیب صدیقی </br> 0300-9427139</div>
  <div>قاری محمد طاہر فاروقی </br> 0300-4286360</div>
  <div>علامہ سعید احمد عثمانی </br> 0321-4615565</div>
</div>
`,

    // Entities :[
    // {EntityId: 1 , Name : 'جامع  مسجد  ربانی' },
    // {EntityId: 2 , Name : 'دارالعلوم  بحرِ  مدینہ' },
    // {EntityId: 3 , Name : 'نِشتر  قبرستان' },
    // ]
  },
};

// Detect current hostname
const hostname = window.location.hostname;
export const CONFIG = clientConfigs[hostname] || clientConfigs["localhost"];


// firebase deploy --only hosting

