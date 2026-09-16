import { defaults, emptyProgress, type Snapshot } from "./domain";
const names = [
  "Ayu Kusumadyastuti",
  "Esy Fitrianingrum",
  "Puput Alfrianti",
  "Budi Santoso",
  "Siti Rahmawati",
  "Dewi Lestari",
  "Agus Prasetyo",
  "Sri Wahyuni",
  "Rina Wulandari",
  "Dwi Susanti",
  "Ahmad Fauzi",
  "Nur Hidayah",
  "Tri Handayani",
  "Eko Saputra",
  "Ratna Sari",
  "Bambang Setiawan",
  "Yuni Astuti",
  "Dian Puspita",
  "Suhartini",
  "Indah Permata",
  "Joko Susilo",
  "Fitri Amalia",
  "Wahyu Nugroho",
  "Endang Rahayu",
  "Nurul Huda",
  "Peserta 26",
  "Peserta 27",
  "Peserta 28",
  "Peserta 29",
  "Peserta 30",
];
const institutions = [
  "SDN Sadeng 01",
  "SDN Sadeng 02",
  "SDN Wonotingal",
  "SDN Kalisegoro",
  "SDN Patemon",
];
export function demoSnapshot(): Snapshot {
  return {
    config: { ...defaults },
    participants: names.map((name, i) => {
      const progress = emptyProgress();
      progress.WEBSITE.status = i < 19 && i !== 4;
      progress.VIDEO.status = i < 16 && i !== 2;
      progress.PREPOST.status = i < 21 && i !== 1;
      return {
        participant_id: `peserta-${String(i + 1).padStart(2, "0")}`,
        name,
        institution: i < 25 ? institutions[i % 5] : "Instansi belum diisi",
        is_active: true,
        progress,
      };
    }),
  };
}
