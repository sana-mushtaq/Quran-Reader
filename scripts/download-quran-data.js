const fs = require('fs');
const path = require('path');

async function downloadQuranData() {
  console.log('Downloading complete Quran data...');
  
  console.log('Fetching Arabic text with audio (ar.alafasy)...');
  const arabicRes = await fetch('https://api.alquran.cloud/v1/quran/ar.alafasy');
  const arabicJson = await arabicRes.json();
  
  console.log('Fetching English translation (en.asad)...');
  const translationRes = await fetch('https://api.alquran.cloud/v1/quran/en.asad');
  const translationJson = await translationRes.json();
  
  if (arabicJson.code !== 200 || translationJson.code !== 200) {
    throw new Error('Failed to fetch Quran data');
  }
  
  const arabicSurahs = arabicJson.data.surahs;
  const translationSurahs = translationJson.data.surahs;
  
  const surahList = arabicSurahs.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    numberOfAyahs: s.numberOfAyahs,
    revelationType: s.revelationType,
  }));
  
  const surahsData = {};
  for (let i = 0; i < arabicSurahs.length; i++) {
    const arabic = arabicSurahs[i];
    const translation = translationSurahs[i];
    const num = arabic.number;
    
    surahsData[num] = {
      number: arabic.number,
      name: arabic.name,
      englishName: arabic.englishName,
      englishNameTranslation: arabic.englishNameTranslation,
      numberOfAyahs: arabic.numberOfAyahs,
      revelationType: arabic.revelationType,
      ayahs: arabic.ayahs.map((a, j) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        audio: a.audio,
        translation: translation.ayahs[j]?.text || '',
      })),
    };
  }
  
  const outputDir = path.join(__dirname, '..', 'assets', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'surah-list.json'),
    JSON.stringify(surahList)
  );
  console.log(`Saved surah-list.json (${surahList.length} surahs)`);
  
  fs.writeFileSync(
    path.join(outputDir, 'quran-data.json'),
    JSON.stringify(surahsData)
  );
  
  const stats = fs.statSync(path.join(outputDir, 'quran-data.json'));
  console.log(`Saved quran-data.json (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log('Done!');
}

downloadQuranData().catch(console.error);
