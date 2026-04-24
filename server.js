const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'genshin_app'
});

db.connect((err) => {
    if (err) {
        console.error('Database gagal connect:', err);
    } else {
        console.log('Database connected');
    }
});

app.get('/characters', async (req, res) => {
    try {
        const apiRes = await fetch('https://genshin.jmp.blue/characters/all');

        if (!apiRes.ok) {
            throw new Error(`API gagal: ${apiRes.status}`);
        }

        const rawData = await apiRes.json();
        const apiCharacters = Array.isArray(rawData) ? rawData : Object.values(rawData);

        db.query('SELECT name, image FROM character_icons', (err, iconRows) => {
            if (err) {
                console.error('Error database:', err);
                return res.status(500).json({ error: 'Gagal ambil icon dari database' });
            }

            const mergedResults = apiCharacters.map((char) => {
                const slug = (char.id || char.name)
                    .toString()
                    .toLowerCase()
                    .replace(/ /g, '-');

                const iconFromSql = iconRows.find(
                    item => item.name.toLowerCase() === char.name.toLowerCase()
                );

                return {
                    id: slug,
                    name: char.name,
                    rarity: `${char.rarity}_star`,
                    weapon: char.weapon,
                    vision: char.vision,
                    nation: char.nation,
                    affiliation: char.affiliation,
                    birthday: char.birthday,
                    constellation: char.constellation,
                    description: char.description,
                    image: iconFromSql?.image || `https://genshin.jmp.blue/characters/${slug}/icon`
                };
            });

            res.json({
                results: mergedResults,
                total_results: mergedResults.length
            });
        });
    } catch (error) {
        console.error('Error route /characters:', error);
        res.status(500).json({ error: 'Gagal mengambil data character' });
    }
});

app.get('/banners', (req, res) => {
    db.query('SELECT * FROM banners ORDER BY id ASC', (err, results) => {
        if (err) {
            console.error('Error ambil data banners:', err);
            return res.status(500).json({ error: 'Gagal mengambil data banners' });
        }

        res.json({
            results,
            total_results: results.length
        });
    });
});

app.get('/homepage-background', (req, res) => {
    db.query(
        'SELECT * FROM homepage_backgrounds WHERE is_active = 1 LIMIT 1',
        (err, results) => {
            if (err) {
                console.error('Error ambil background homepage:', err);
                return res.status(500).json({ error: 'Gagal mengambil background homepage' });
            }

            if (results.length === 0) {
                return res.json({ image: '' });
            }

            res.json(results[0]);
        }
    );
});

app.get('/trailers', (req, res) => {
    db.query('SELECT * FROM trailers ORDER BY id ASC', (err, results) => {
        if (err) {
            console.error('Error ambil data trailers:', err);
            return res.status(500).json({ error: 'Gagal mengambil data trailers' });
        }

        res.json({
            results,
            total_results: results.length
        });
    });
});

app.get('/weapons', async (req, res) => {
    try {
        const apiRes = await fetch('https://genshin.jmp.blue/weapons/all');

        if (!apiRes.ok) {
            throw new Error(`API gagal: ${apiRes.status}`);
        }

        const rawData = await apiRes.json();
        const apiWeapons = Array.isArray(rawData) ? rawData : Object.values(rawData);

        db.query('SELECT name, image FROM weapon_icons', (err, iconRows) => {
            if (err) {
                console.error('Error database:', err);
                return res.status(500).json({ error: 'Gagal ambil icon weapon dari database' });
            }

            const mergedResults = apiWeapons.map((weapon) => {
                const slug = (weapon.id || weapon.name)
                    .toString()
                    .toLowerCase()
                    .replace(/ /g, '-');

                const iconFromSql = iconRows.find(
                    item => item.name.toLowerCase() === weapon.name.toLowerCase()
                );

                return {
                    id: slug,
                    name: weapon.name,
                    rarity: `${weapon.rarity}_star`,
                    type: weapon.type,
                    baseAttack: weapon.baseAttack,
                    subStat: weapon.subStat || '-',
                    passiveName: weapon.passiveName || '-',
                    description: weapon.description || '-',
                    image: iconFromSql?.image || `https://genshin.jmp.blue/weapons/${slug}/icon`
                };
            });

            res.json({
                results: mergedResults,
                total_results: mergedResults.length
            });
        });
    } catch (error) {
        console.error('Error route /weapons:', error);
        res.status(500).json({ error: 'Gagal mengambil data weapon' });
    }
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});