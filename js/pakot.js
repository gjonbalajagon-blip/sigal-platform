// ====== PAKOT.JS — Te dhenat e sakta nga dokumentet SIGAL ======

const PAKOT = {
    individ: [
        {
            id: 'individ_baze', emri: 'Bazë',
            zona: 'KS', shuma: '20,000',
            // Hospitalore items (te gjitha 100%)
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            // Ambulantore
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: 'Nuk mbulohet' },
                { emri: 'Mjeku specialist', vlera: 'Nuk mbulohet' },
                { emri: 'Kirurgjia ditore', vlera: 'Nuk mbulohet' },
                { emri: 'Kontrolle diagnostifikuese', vlera: 'Nuk mbulohet' },
                { emri: 'Analizat laboratorike', vlera: 'Nuk mbulohet' },
                { emri: 'Ilaçet e këshilluara', vlera: 'Nuk mbulohet' }
            ],
            ambulantore: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            ambulantore_merged: true,
            // Trajtime tjera
            shtatzania: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            dentar: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            optik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            degim: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            psikiatrik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            fizioterapi: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            tjera_merged: true,
            // Aksidente & te tjera
            autoambulanca: '100% deri në € 50',
            aksidentit: '100% deri në € 5,000',
            onkologjike: '100% deri në € 5,000',
            // Primi
            primi_madh: '270', primi_madh_label: 'Primi vjetor', primi_suffix: '/vit',
            // Tags per compact view
            tags: { hospitalore: '100%', ambulantore: 'Nuk mbulohet', tjera: 'Rrjeti Mjekësor', aksidente: '€ 5,000' }
        },
        {
            id: 'individ_standard', emri: 'Standard',
            zona: 'KS, ALB', shuma: '30,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '80% deri në € 500' },
                { emri: 'Mjeku specialist', vlera: '80% deri në € 500' },
                { emri: 'Kirurgjia ditore', vlera: '80% deri në € 500' },
                { emri: 'Kontrolle diagnostifikuese', vlera: '80% deri në € 500' },
                { emri: 'Analizat laboratorike', vlera: '80% deri në € 500' },
                { emri: 'Ilaçet e këshilluara', vlera: '80% deri në € 500' }
            ],
            ambulantore: '80% deri në € 500',
            ambulantore_merged: true,
            shtatzania: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            dentar: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            optik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            degim: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            psikiatrik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            fizioterapi: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            tjera_merged: true,
            autoambulanca: '100% deri në € 100',
            aksidentit: '100% deri në € 10,000',
            onkologjike: '100% deri në € 10,000',
            primi_madh: '360', primi_madh_label: 'Primi vjetor', primi_suffix: '/vit',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: 'Rrjeti Mjekësor', aksidente: '€ 10,000' }
        },
        {
            id: 'individ_standard_plus', emri: 'Standard Plus',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '50,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '80% deri në € 1,000' },
                { emri: 'Mjeku specialist', vlera: '80% deri në € 1,000' },
                { emri: 'Kirurgjia ditore', vlera: '80% deri në € 1,000' },
                { emri: 'Kontrolle diagnostifikuese', vlera: '80% deri në € 1,000' },
                { emri: 'Analizat laboratorike', vlera: '80% deri në € 1,000' },
                { emri: 'Ilaçet e këshilluara', vlera: '80% deri në € 1,000' }
            ],
            ambulantore: '80% deri në € 1,000',
            ambulantore_merged: true,
            shtatzania: '80% deri në € 800',
            dentar: '80% deri në € 80',
            optik: '80% deri në € 60',
            degim: '80% deri në € 100',
            psikiatrik: '80% deri në € 100',
            fizioterapi: '80% deri në € 50',
            tjera_merged: false,
            autoambulanca: '100% deri në € 150',
            aksidentit: '100% deri në € 15,000',
            onkologjike: '100% deri në € 15,000',
            primi_madh: '450', primi_madh_label: 'Primi vjetor', primi_suffix: '/vit',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 15,000' }
        }
    ],
    familje_biznes: [
        {
            id: 'fb_baze', emri: 'Bazë',
            zona: 'KS', shuma: '20,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: 'Nuk mbulohet' },
                { emri: 'Mjeku specialist', vlera: 'Nuk mbulohet' },
                { emri: 'Kirurgjia ditore', vlera: 'Nuk mbulohet' },
                { emri: 'Kontrolle diagnostifikuese', vlera: 'Nuk mbulohet' },
                { emri: 'Analizat laboratorike', vlera: 'Nuk mbulohet' },
                { emri: 'Ilaçet e këshilluara', vlera: 'Nuk mbulohet' }
            ],
            ambulantore: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            ambulantore_merged: true,
            shtatzania: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            dentar: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            optik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            degim: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            psikiatrik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            fizioterapi: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            tjera_merged: true,
            autoambulanca: '100% deri në € 50',
            aksidentit: '100% deri në € 5,000',
            onkologjike: '100% deri në € 5,000',
            primi_madh: '15', primi_femije: '13', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: 'Nuk mbulohet', tjera: 'Rrjeti Mjekësor', aksidente: '€ 5,000' }
        },
        {
            id: 'fb_standard', emri: 'Standard',
            zona: 'KS, ALB', shuma: '30,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '80%' },
                { emri: 'Mjeku specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara', vlera: '80%' }
            ],
            ambulantore: '80%',
            ambulantore_merged: true,
            shtatzania: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            dentar: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            optik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            degim: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            psikiatrik: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            fizioterapi: 'Nuk mbulohet; Zbritje brenda Rrjetit Mjekësor',
            tjera_merged: true,
            autoambulanca: '100% deri në € 100',
            aksidentit: '100% deri në € 10,000',
            onkologjike: '100% deri në € 10,000',
            primi_madh: '20', primi_femije: '18', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: 'Rrjeti Mjekësor', aksidente: '€ 10,000' }
        },
        {
            id: 'fb_standard_plus', emri: 'Standard Plus',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '50,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '80%' },
                { emri: 'Mjeku specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara', vlera: '80%' }
            ],
            ambulantore: '80%',
            ambulantore_merged: true,
            shtatzania: '80% deri në € 1,000',
            dentar: '80% deri në € 100',
            optik: '80% deri në € 70',
            degim: '80% deri në € 100',
            psikiatrik: '80% deri në € 100',
            fizioterapi: '80% deri në € 70',
            tjera_merged: false,
            autoambulanca: '100% deri në € 150',
            aksidentit: '100% deri në € 15,000',
            onkologjike: '100% deri në € 15,000',
            primi_madh: '30', primi_femije: '27', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 15,000' }
        },
        {
            id: 'fb_premium', emri: 'Premium',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR', shuma: '70,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '80%' },
                { emri: 'Mjeku specialist', vlera: '80%' },
                { emri: 'Kirurgjia ditore', vlera: '80%' },
                { emri: 'Kontrolle diagnostifikuese', vlera: '80%' },
                { emri: 'Analizat laboratorike', vlera: '80%' },
                { emri: 'Ilaçet e këshilluara', vlera: '80%' }
            ],
            ambulantore: '80%',
            ambulantore_merged: true,
            shtatzania: '80% deri në € 1,200',
            dentar: '80% deri në € 120',
            optik: '80% deri në € 80',
            degim: '80% deri në € 120',
            psikiatrik: '80% deri në € 120',
            fizioterapi: '80% deri në € 100',
            tjera_merged: false,
            autoambulanca: '100% deri në € 200',
            aksidentit: '100% deri në € 20,000',
            onkologjike: '100% deri në € 20,000',
            primi_madh: '35', primi_femije: '32', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 20,000' }
        },
        {
            id: 'fb_silver', emri: 'Silver',
            zona: 'KS, ALB, NMK, MNE, SRB, SLO, HR, TR', shuma: '100,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Mjeku specialist', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Kirurgjia ditore', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Kontrolle diagnostifikuese', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Analizat laboratorike', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' },
                { emri: 'Ilaçet e këshilluara', vlera: 'Rajoni: 80%; TR: 80% deri në € 2,000' }
            ],
            ambulantore: 'Rajoni: 80%; TR: 80% deri në € 2,000',
            ambulantore_merged: true,
            shtatzania: '80% deri në € 1,500',
            dentar: '80% deri në € 150',
            optik: '80% deri në € 100',
            degim: '80% deri në € 150',
            psikiatrik: '80% deri në € 150',
            fizioterapi: '80% deri në € 150',
            tjera_merged: false,
            autoambulanca: '100% deri në € 300',
            aksidentit: '100% deri në € 25,000',
            onkologjike: '100% deri në € 30,000',
            primi_madh: '60', primi_femije: '55', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '80%', tjera: '80%', aksidente: '€ 25,000' }
        },
        {
            id: 'fb_gold', emri: 'Gold',
            zona: 'Gjithë bota (pa SHBA, Kanada, Zvicër)', shuma: '200,000',
            hospitalore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: '100%' },
                { emri: 'Mjeku specialist', vlera: '100%' },
                { emri: 'Operacioni', vlera: '100%' },
                { emri: 'Kujdesi intenziv', vlera: '100%' },
                { emri: 'Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)', vlera: '100%' },
                { emri: 'Analizat laboratorike', vlera: '100%' },
                { emri: 'Ilaçet e këshilluara', vlera: '100%' }
            ],
            hospitalore: '100%',
            ambulantore_pikat: [
                { emri: 'Mjeku i përgjithshëm', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Mjeku specialist', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Kirurgjia ditore', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Kontrolle diagnostifikuese', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Analizat laboratorike', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' },
                { emri: 'Ilaçet e këshilluara', vlera: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000' }
            ],
            ambulantore: 'Rajoni: 100%; Jashtë: 100% deri në € 5,000',
            ambulantore_merged: true,
            shtatzania: '100% deri në € 2,000',
            dentar: '100% deri në € 200',
            optik: '100% deri në € 150',
            degim: '100% deri në € 200',
            psikiatrik: '100% deri në € 200',
            fizioterapi: '100% deri në € 200',
            tjera_merged: false,
            autoambulanca: '100% deri në € 400',
            aksidentit: '100% deri në € 30,000',
            onkologjike: '100% deri në € 50,000',
            primi_madh: '100', primi_femije: '90', primi_suffix: '/muaj',
            tags: { hospitalore: '100%', ambulantore: '100%', tjera: '100%', aksidente: '€ 30,000' }
        }
    ],
    // Pakot opsionale
    opsionale: {
        jete_plus_cash: {
            id: 'jete_plus_cash',
            emri: 'Jetë Plus Cash',
            pershkrim: 'Kompensim financiar i menjëhershëm për familjen në rast ndodhie të papritur.',
            primi: '€ 12/vit (€ 1/muaj)',
            badge: 'Rekomanduar'
        },
        opinioni_dyte: {
            id: 'opinioni_dyte',
            emri: 'Opinioni i Dytë Mjekësor',
            pershkrim: 'Mendim i specializuar ndërkombëtar për diagnoza dhe trajtime të rëndësishme.',
            primi: '€ 12/vit (€ 1/muaj)',
            badge: 'I ri'
        }
    }
};