// ====== PAKOT.JS — Te dhenat e sakta nga dokumentet SIGAL ======
// Struktura sipas Word template: Hospitalore → Ambulantore → Trajtime tjera (perfshire aksidentin, onkologjine)

const PAKOT = {
    individ: [
        {
            id: 'individ_baze', emri: 'Bazë',
            zona: 'KS', shuma: '20,000',
            // HOSPITALORE (dhomë gjysëmprivate)
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            // AMBULANTORE
            ambulantore: 'Nuk mbulohet',
            ambulantore_zbritje: true,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: 'Nuk mbulohet' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: 'Nuk mbulohet' },
                { emri: 'Kirurgjia ditore', vlera: 'Nuk mbulohet' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: 'Nuk mbulohet' },
                { emri: 'Analizat laboratorike', vlera: 'Nuk mbulohet' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: 'Nuk mbulohet' }
            ],
            // TRAJTIME MJEKESORE TJERA (perfshire aksidentin dhe onkologjine)
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi dentar', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi optik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi për dëgjim', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi psikiatrik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Fizioterapia', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 50' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 5,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 5,000' }
            ],
            tjera_merged: true, // te gjitha "nuk mbulohet" pervec 3 te fundit
            // PRIMET
            primi_madh: '270', primi_suffix: '/vit',
            // Tags
            tags: { hospitalore: '100%', ambulantore: 'Nuk mbulohet', tjera: 'Rrjeti Mjekësor', aksidente: '€ 5,000' }
        },
        {
            id: 'individ_standard', emri: 'Standard',
            zona: 'KS, ALB', shuma: '30,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: '80%',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '80%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '80%' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi dentar', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi optik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi për dëgjim', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi psikiatrik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Fizioterapia', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 100' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 10,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 10,000' }
            ],
            tjera_merged: true,
            primi_madh: '360', primi_suffix: '/vit',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: 'Rrjeti Mjekësor', aksidente: '€ 10,000' }
        },
        {
            id: 'individ_standard_plus', emri: 'Standard Plus',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '50,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: '80% deri në € 1,000',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '80% deri në € 1,000' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '80% deri në € 1,000' },
                { emri: 'Kirurgjia ditore', vlera: '80% deri në € 1,000' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '80% deri në € 1,000' },
                { emri: 'Analizat laboratorike', vlera: '80% deri në € 1,000' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '80% deri në € 1,000' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: '80% deri në € 800' },
                { emri: 'Kujdesi dentar', vlera: '80% deri në € 80' },
                { emri: 'Kujdesi optik', vlera: '80% deri në € 60' },
                { emri: 'Kujdesi për dëgjim', vlera: '80% deri në € 100' },
                { emri: 'Kujdesi psikiatrik', vlera: '80% deri në € 100' },
                { emri: 'Fizioterapia', vlera: '80% deri në € 50' },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 150' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 15,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 15,000' }
            ],
            tjera_merged: false,
            primi_madh: '450', primi_suffix: '/vit',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 15,000' }
        }
    ],
    familje_biznes: [
        {
            id: 'fb_baze', emri: 'Bazë',
            zona: 'KS', shuma: '20,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: 'Nuk mbulohet',
            ambulantore_zbritje: true,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: 'Nuk mbulohet' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: 'Nuk mbulohet' },
                { emri: 'Kirurgjia ditore', vlera: 'Nuk mbulohet' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: 'Nuk mbulohet' },
                { emri: 'Analizat laboratorike', vlera: 'Nuk mbulohet' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: 'Nuk mbulohet' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi dentar', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi optik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi për dëgjim', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi psikiatrik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Fizioterapia', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 50' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 5,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 5,000' }
            ],
            tjera_merged: true,
            primi_madh: '15', primi_femije: '13', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: 'Nuk mbulohet', tjera: 'Rrjeti Mjekësor', aksidente: '€ 5,000' }
        },
        {
            id: 'fb_standard', emri: 'Standard',
            zona: 'KS, ALB', shuma: '30,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: '80%',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '80%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '80%' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi dentar', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi optik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi për dëgjim', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Kujdesi psikiatrik', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Fizioterapia', vlera: 'Nuk mbulohet', zbritje: true },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 100' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 10,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 10,000' }
            ],
            tjera_merged: true,
            primi_madh: '20', primi_femije: '18', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: 'Rrjeti Mjekësor', aksidente: '€ 10,000' }
        },
        {
            id: 'fb_standard_plus', emri: 'Standard Plus',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '50,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: '80%',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '80%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '80%' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: '80% deri në € 1,000' },
                { emri: 'Kujdesi dentar', vlera: '80% deri në € 100' },
                { emri: 'Kujdesi optik', vlera: '80% deri në € 70' },
                { emri: 'Kujdesi për dëgjim', vlera: '80% deri në € 100' },
                { emri: 'Kujdesi psikiatrik', vlera: '80% deri në € 100' },
                { emri: 'Fizioterapia', vlera: '80% deri në € 70' },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 150' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 15,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 15,000' }
            ],
            tjera_merged: false,
            primi_madh: '30', primi_femije: '27', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 15,000' }
        },
        {
            id: 'fb_premium', emri: 'Premium',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '70,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: '80%',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '80%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '80%' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: '80% deri në € 1,200' },
                { emri: 'Kujdesi dentar', vlera: '80% deri në € 120' },
                { emri: 'Kujdesi optik', vlera: '80% deri në € 80' },
                { emri: 'Kujdesi për dëgjim', vlera: '80% deri në € 120' },
                { emri: 'Kujdesi psikiatrik', vlera: '80% deri në € 120' },
                { emri: 'Fizioterapia', vlera: '80% deri në € 100' },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 200' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 20,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 20,000' }
            ],
            tjera_merged: false,
            primi_madh: '35', primi_femije: '32', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 20,000' }
        },
        {
            id: 'fb_silver', emri: 'Silver',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR, TR', shuma: '100,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: 'Rajoni: 80%; TR: 80% deri në € 2,000',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Kirurgjia ditore', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Analizat laboratorike', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: '80% deri në € 1,500' },
                { emri: 'Kujdesi dentar', vlera: '80% deri në € 150' },
                { emri: 'Kujdesi optik', vlera: '80% deri në € 100' },
                { emri: 'Kujdesi për dëgjim', vlera: '80% deri në € 150' },
                { emri: 'Kujdesi psikiatrik', vlera: '80% deri në € 150' },
                { emri: 'Fizioterapia', vlera: '80% deri në € 150' },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 300' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 25,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 30,000' }
            ],
            tjera_merged: false,
            primi_madh: '60', primi_femije: '55', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 25,000' }
        },
        {
            id: 'fb_gold', emri: 'Gold',
            zona: 'Gjithë bota (pa SHBA, Kanada, Zvicër)', shuma: '200,000',
            hospitalore: '100%',
            hospitalore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: '100%' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: '100%' },
                { emri: 'Shpenzimet për operacion', vlera: '100%' },
                { emri: 'Shpenzimet për kujdesin intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: '100%' }
            ],
            ambulantore: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000',
            ambulantore_zbritje: false,
            ambulantore_pikat: [
                { emri: 'Shpenzimet për mjekun e përgjithshëm', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Shpenzimet për mjekun specialist', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Kirurgjia ditore', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Kontrolle diagnostifikuese, duke përfshirë ato patologjike, rreze X, skane CT, skane MRI, skane PET', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Analizat laboratorike', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Ilaçet e këshilluara nga mjeku', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' }
            ],
            tjera_pikat: [
                { emri: 'Kujdesi gjatë shtatzanisë dhe lindja', vlera: '100% deri në € 2,000' },
                { emri: 'Kujdesi dentar', vlera: '100% deri në € 200' },
                { emri: 'Kujdesi optik', vlera: '100% deri në € 150' },
                { emri: 'Kujdesi për dëgjim', vlera: '100% deri në € 200' },
                { emri: 'Kujdesi psikiatrik', vlera: '100% deri në € 200' },
                { emri: 'Fizioterapia', vlera: '100% deri në € 200' },
                { emri: 'Autoambulanca brenda dhe jashtë Kosovës', vlera: '100% deri në € 400' },
                { emri: 'Shpenzimet e mjekimit si pasojë e aksidentit', vlera: '100% deri në € 30,000' },
                { emri: 'Trajtimet onkologjike', vlera: '100% deri në € 50,000' }
            ],
            tjera_merged: false,
            primi_madh: '100', primi_femije: '90', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '100%', tjera: '100%', aksidente: '€ 30,000' }
        }
    ],
    // Pakot opsionale me te dhena te plota per shfaqje pas selektimit
    opsionale: {
        jete_plus_cash: {
            id: 'jete_plus_cash',
            emri: 'Jetë Plus Cash',
            tagline: 'Mbrojtje financiare për familjen tuaj në çdo moment',
            pershkrim: 'Kompensim financiar i menjëhershëm për familjen në rast ndodhie të papritur.',
            primi_vjetor: '€ 24/vit',
            primi_mujor: '€ 2/muaj',
            badge: 'Rekomanduar',
            detajet: [
                { emri: 'Vdekja nga aksidenti', vlera: '€ 5,000' },
                { emri: 'Invaliditeti i përhershëm nga aksidenti', vlera: '€ 5,000' },
                { emri: 'Shpenzime spitalore nga aksidenti', vlera: '€ 1,000' },
                { emri: 'Kompensim ditor spitalor', vlera: '€ 20/ditë deri 30 ditë' }
            ]
        },
        opinioni_dyte: {
            id: 'opinioni_dyte',
            emri: 'Opinioni i Dytë Mjekësor',
            tagline: 'Mendim ekspërt ndërkombëtar për vendimet tuaja shëndetësore',
            pershkrim: 'Mendim i specializuar ndërkombëtar për diagnoza dhe trajtime të rëndësishme shëndetësore.',
            primi_vjetor: '€ 12/vit',
            primi_mujor: '€ 1/muaj',
            badge: 'I ri',
            detajet: [
                { emri: 'Rishikim i diagnozës', vlera: 'E përfshirë' },
                { emri: 'Plan trajtimi alternativ', vlera: 'E përfshirë' },
                { emri: 'Rrjeti', vlera: 'Mjekë ndërkombëtarë' },
                { emri: 'Koha e përgjigjes', vlera: 'Deri në 5 ditë pune' }
            ]
        }
    }
};