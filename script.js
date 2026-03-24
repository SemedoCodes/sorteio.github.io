let bibliotecaAssociados = [];
let emEspera = [];

const LIMITES = {
    "Zona A": 10,
    "Zona B": 12,
    "Zona C": 10,
};

function subirPagina() {
    document.getElementById('wrapper').classList.add('subiu');
}



document.querySelector('.input-sorteio').addEventListener('change', function(e) {
    const ficheiro = e.target.files[0];
    const leitor = new FileReader();

    leitor.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const folha = workbook.Sheets[workbook.SheetNames[0]];
        
        // Lemos como matriz para não falhar com nomes de colunas
        const matriz = XLSX.utils.sheet_to_json(folha, { header: 1 });
        const linhas = matriz.slice(1); 

        bibliotecaAssociados = linhas.map(linha => {
            // Criamos um mapa de preferências: { "1": "Zona B", "2": "Zona A", ... }
            let prefs = {};
            if (linha[2]) prefs[linha[2].toString().trim()] = "Zona A";
            if (linha[3]) prefs[linha[3].toString().trim()] = "Zona B";
            if (linha[4]) prefs[linha[4].toString().trim()] = "Zona C";

            return {
                timestamp: new Date(linha[0]),
                nome: linha[1],
                // Ordenamos as zonas pela preferência 1, 2, 3...
                escolhasOrdenadas: [prefs["1"], prefs["2"], prefs["3"], prefs["4"]].filter(z => z)
            };
        }).filter(a => a.nome);

        console.log("Biblioteca Organizada:", bibliotecaAssociados);
        alert("Carregado! " + bibliotecaAssociados.length + " associados.");
    };
    leitor.readAsArrayBuffer(ficheiro);
});

function sortear() {
    if (bibliotecaAssociados.length === 0) return alert("Carrega o ficheiro!");

    let alocacao = { "Zona A": [], "Zona B": [], "Zona C": [] };
    let emEspera = [];

    // Ordenar por tempo
    const fila = [...bibliotecaAssociados].sort((a, b) => a.timestamp - b.timestamp);

    fila.forEach(pessoa => {
        let alocado = false;

        for (let zona of pessoa.escolhasOrdenadas) {
            if (alocacao[zona] && alocacao[zona].length < LIMITES[zona]) {
                alocacao[zona].push(pessoa);
                alocado = true;
                break;
            }
        }
        if (!alocado) emEspera.push(pessoa);
    });

    renderizarTabelas(alocacao, emEspera);
}

function renderizarTabelas(grupos, espera = []) {
    let resultadoDiv = document.getElementById('resultados');
    if (!resultadoDiv) {
        resultadoDiv = document.createElement('div');
        resultadoDiv.id = 'resultados';
        document.getElementById('tela-input').appendChild(resultadoDiv);
    }
    
    resultadoDiv.innerHTML = "<h2>Distribuição</h2>";

    for (const zona in grupos) {
        let html = `<div class="panel panel-primary" style="margin: 10px; background: white; color: black;">
            <div class="panel-heading"><b>${zona}</b> (${grupos[zona].length} vagas preenchidas)</div>
            <ul class="list-group">`;
        
        grupos[zona].forEach(p => {
            html += `<li class="list-group-item">${p.nome}</li>`;
        });

        if (grupos[zona].length === 0) html += `<li class="list-group-item text-muted">Vazia</li>`;
        html += `</ul></div>`;
        resultadoDiv.innerHTML += html;
    }

    if (espera.length > 0) {
        let esperaHtml = `<div class="panel panel-danger" style="margin:10px;">
            <div class="panel-heading">Lista de Espera</div>
            <ul class="list-group">`;
        espera.forEach(p => { esperaHtml += `<li class="list-group-item">${p.nome}</li>`; });
        esperaHtml += `</ul></div>`;
        resultadoDiv.innerHTML += esperaHtml;
    }
}
