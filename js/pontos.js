// Carrega os pontos turísticos de data/pontos.json e monta a tela:
// busca por texto, filtro por categoria, filtro por bairro, paginação
// ("Ver mais" a cada 9 itens) e o botão que abre o vídeo em um modal
// separado (apenas para pontos que tenham temVideo: true).

const URL_DADOS = 'data/pontos.json';
const QUANTIDADE_INICIAL = 9;
const INCREMENTO = 9;

let pontos = [];
let categoriaAtual = 'todas';
let bairroAtual = 'todas';
let quantidadeVisivel = QUANTIDADE_INICIAL;

async function carregarPontos() {
    const lista = document.getElementById('lista-pontos');

    try {
        const resposta = await fetch(URL_DADOS);

        if (!resposta.ok) {
            throw new Error('Resposta não OK ao buscar pontos.json');
        }

        pontos = await resposta.json();

        montarFiltros('filtros-categoria', 'categoria', 'Todas', function (valor) {
            categoriaAtual = valor;
            quantidadeVisivel = QUANTIDADE_INICIAL;
            atualizarContadorFiltros();
            renderizarPontos();
        });

        montarFiltros('filtros-bairro', 'bairro', 'Todos', function (valor) {
            bairroAtual = valor;
            quantidadeVisivel = QUANTIDADE_INICIAL;
            atualizarContadorFiltros();
            renderizarPontos();
        });

        preencherSelectAvaliacao();
        atualizarContadorFiltros();
        renderizarPontos();

    } catch (erro) {
        console.error('Erro ao carregar pontos turísticos:', erro);
        if (lista) {
            lista.innerHTML = '<p role="alert">Não foi possível carregar os pontos turísticos agora. ' +
                'Se você abriu o arquivo direto no navegador, rode um servidor local (ex: extensão Live Server) e tente de novo.</p>';
        }
    }
}

function montarFiltros(idContainer, campo, rotuloTodos, aoClicar) {
    const container = document.getElementById(idContainer);
    if (!container) return;

    const valores = ['todas', ...new Set(pontos.map(function (p) { return p[campo]; }))];

    container.innerHTML = '';

    valores.forEach(function (valor) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.textContent = valor === 'todas' ? rotuloTodos : valor;
        botao.setAttribute('aria-pressed', valor === 'todas' ? 'true' : 'false');

        botao.addEventListener('click', function () {
            [...container.children].forEach(function (b) {
                b.setAttribute('aria-pressed', 'false');
            });
            botao.setAttribute('aria-pressed', 'true');
            aoClicar(valor);
        });

        container.appendChild(botao);
    });
}

function preencherSelectAvaliacao() {
    const select = document.getElementById('ponto-turistico');
    if (!select) return;

    const jaExistem = new Set([...select.options].map(function (o) { return o.value; }));

    pontos.forEach(function (ponto) {
        if (!jaExistem.has(ponto.id)) {
            const opcao = document.createElement('option');
            opcao.value = ponto.id;
            opcao.textContent = ponto.nome;
            select.appendChild(opcao);
        }
    });
}

function criarCard(ponto) {
    const card = document.createElement('article');
    card.className = 'ponto-card';

    const media = document.createElement('div');
    media.className = 'ponto-media';

    if (ponto.imagem) {
        const img = document.createElement('img');
        img.src = ponto.imagem;
        img.alt = ponto.imagemAlt || ponto.nome;
        img.loading = 'lazy';
        media.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'ponto-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        media.appendChild(placeholder);
    }

    const corpo = document.createElement('div');
    corpo.className = 'ponto-corpo';

    const categoria = document.createElement('span');
    categoria.className = 'ponto-categoria';
    categoria.textContent = ponto.categoria;

    const titulo = document.createElement('h3');
    titulo.textContent = ponto.nome;

    const bairro = document.createElement('p');
    bairro.className = 'ponto-bairro';
    bairro.textContent = ponto.bairro;

    const descricao = document.createElement('p');
    descricao.textContent = ponto.descricao;

    corpo.appendChild(categoria);
    corpo.appendChild(titulo);
    corpo.appendChild(bairro);
    corpo.appendChild(descricao);

    const botaoVideo = document.createElement('button');
    botaoVideo.type = 'button';
    botaoVideo.className = 'botao-video';
    botaoVideo.textContent = 'Assistir vídeo';
    botaoVideo.addEventListener('click', function () {
        abrirModalVideo(ponto);
    });
    corpo.appendChild(botaoVideo);

    card.appendChild(media);
    card.appendChild(corpo);
    return card;
}

function abrirModalVideo(ponto) {
    const modal = document.getElementById('modal-video');
    const titulo = document.getElementById('modal-video-titulo');
    const player = document.getElementById('modal-video-player');
    const mensagemIndisponivel = document.getElementById('modal-video-indisponivel');

    if (!modal || !player) return;

    titulo.textContent = ponto.nome;

    if (ponto.video) {
        player.hidden = false;
        mensagemIndisponivel.hidden = true;

        player.poster = ponto.video.poster || '';
        document.getElementById('modal-video-legenda').src = ponto.video.legenda || '';

        const fontePorTipo = {};
        ponto.video.fontes.forEach(function (fonte) {
            fontePorTipo[fonte.tipo] = fonte.src;
        });

        document.getElementById('fonte-webm').src = fontePorTipo['video/webm'] || '';
        document.getElementById('fonte-mp4').src = fontePorTipo['video/mp4'] || '';
        document.getElementById('fonte-ogg').src = fontePorTipo['video/ogg'] || '';

        player.load();
    } else {
        player.pause();
        player.hidden = true;
        mensagemIndisponivel.hidden = false;
    }

    modal.showModal();
}

function atualizarBotaoVerMais(total, visivel) {
    const botao = document.getElementById('botao-ver-mais');
    if (!botao) return;
    botao.hidden = total <= visivel;
}

function renderizarPontos() {
    const lista = document.getElementById('lista-pontos');
    if (!lista) return;

    const campoBusca = document.getElementById('busca-pontos');
    const termo = campoBusca ? campoBusca.value.trim().toLowerCase() : '';

    const filtrados = pontos.filter(function (ponto) {
        const bateCategoria = categoriaAtual === 'todas' || ponto.categoria === categoriaAtual;
        const bateBairro = bairroAtual === 'todas' || ponto.bairro === bairroAtual;
        const bateBusca = ponto.nome.toLowerCase().includes(termo) ||
            ponto.descricao.toLowerCase().includes(termo);
        return bateCategoria && bateBairro && bateBusca;
    });

    lista.innerHTML = '';

    if (filtrados.length === 0) {
        lista.innerHTML = '<p>Nenhum ponto turístico encontrado com esse filtro.</p>';
        atualizarBotaoVerMais(0, 0);
        return;
    }

    filtrados.slice(0, quantidadeVisivel).forEach(function (ponto) {
        lista.appendChild(criarCard(ponto));
    });

    atualizarBotaoVerMais(filtrados.length, quantidadeVisivel);
}

function atualizarContadorFiltros() {
    const contador = document.getElementById('contador-filtros');
    if (!contador) return;

    let ativos = 0;
    if (categoriaAtual !== 'todas') ativos++;
    if (bairroAtual !== 'todas') ativos++;

    contador.textContent = String(ativos);
    contador.hidden = ativos === 0;
}

function configurarPainelFiltros() {
    const botao = document.getElementById('botao-filtros');
    const painel = document.getElementById('painel-filtros');
    if (!botao || !painel) return;

    function abrirPainel() {
        painel.hidden = false;
        botao.setAttribute('aria-expanded', 'true');
    }

    function fecharPainel() {
        painel.hidden = true;
        botao.setAttribute('aria-expanded', 'false');
    }

    botao.addEventListener('click', function (evento) {
        evento.stopPropagation();
        if (painel.hidden) {
            abrirPainel();
        } else {
            fecharPainel();
        }
    });

    document.addEventListener('click', function (evento) {
        if (!painel.hidden && !painel.contains(evento.target) && evento.target !== botao) {
            fecharPainel();
        }
    });

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape' && !painel.hidden) {
            fecharPainel();
            botao.focus();
        }
    });
}

configurarPainelFiltros();

const campoBusca = document.getElementById('busca-pontos');
if (campoBusca) {
    campoBusca.addEventListener('input', function () {
        quantidadeVisivel = QUANTIDADE_INICIAL;
        renderizarPontos();
    });
}

const botaoVerMais = document.getElementById('botao-ver-mais');
if (botaoVerMais) {
    botaoVerMais.addEventListener('click', function () {
        quantidadeVisivel += INCREMENTO;
        renderizarPontos();
    });
}

document.querySelectorAll('.fechar-modal').forEach(function (botao) {
    botao.addEventListener('click', function () {
        const dialogo = botao.closest('dialog');
        if (dialogo) dialogo.close();
    });
});

carregarPontos();