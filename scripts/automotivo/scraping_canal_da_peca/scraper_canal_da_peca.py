import requests
from bs4 import BeautifulSoup
import csv
import time
import re

MARCAS = {
    "skf": "https://www.canaldapeca.com.br/marca/skf",
    "nakata": "https://www.canaldapeca.com.br/marca/nakata",
    "gauss": "https://www.canaldapeca.com.br/marca/gauss",
    "cofap": "https://www.canaldapeca.com.br/marca/cofap",
    "mte-thomson": "https://www.canaldapeca.com.br/marca/mte-thomson",
    "mann-filter": "https://www.canaldapeca.com.br/marca/mann-filter",
    "mahle": "https://www.canaldapeca.com.br/marca/mahle",
    "delphi": "https://www.canaldapeca.com.br/marca/delphi",
    "fras-le": "https://www.canaldapeca.com.br/marca/fras-le",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}

OUTPUT_FILE = "produtos_raw.csv"

def get_product_links(marca_url, max_paginas=10):
    links = []
    for pagina in range(1, max_paginas + 1):
        url = f"{marca_url}?orcamento=sim&indisponivel=nao&pagina={pagina}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=20)
            if resp.status_code != 200:
                break
            soup = BeautifulSoup(resp.text, "html.parser")
            page_links = [a["href"] for a in soup.select("a[href*=\'/p/\']") if a.get("href")]
            if not page_links:
                break
            links.extend(page_links)
            time.sleep(1)
        except Exception as e:
            print(f"Erro pagina {pagina} de {marca_url}: {e}")
            break
    return list(set(links))

def get_product_data(url, marca):
    if not url.startswith("http"):
        url = "https://www.canaldapeca.com.br" + url
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")

        codigo = ""
        codigo_el = soup.find(string=re.compile(r"C[óo]d\\.?\\s*[:\\-]?\\s*\\S+"))
        if codigo_el:
            m = re.search(r"C[óo]d\\.?\\s*[:\\-]?\\s*(\\S+)", codigo_el)
            if m:
                codigo = m.group(1)

        descricao = ""
        title_el = soup.find("h1")
        if title_el:
            descricao = title_el.get_text(strip=True)

        aplicacao = ""
        apl_el = soup.find(string=re.compile(r"Aplica[çc][ãa]o", re.IGNORECASE))
        if apl_el:
            parent = apl_el.find_parent()
            if parent:
                next_text = parent.find_next(string=True)
                aplicacao = next_text.strip() if next_text else ""

        return {
            "codigo_peca": codigo,
            "marca_peca": marca,
            "descricao": descricao,
            "aplicacao": aplicacao,
            "url": url,
        }
    except Exception as e:
        print(f"Erro produto {url}: {e}")
        return None

def main():
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["codigo_peca", "marca_peca", "descricao", "aplicacao", "url"])
        writer.writeheader()

        for marca, marca_url in MARCAS.items():
            print(f"\n=== Coletando marca: {marca} ===")
            links = get_product_links(marca_url, max_paginas=10)
            print(f"  {len(links)} produtos encontrados")

            for i, link in enumerate(links, 1):
                data = get_product_data(link, marca)
                if data and data["codigo_peca"]:
                    writer.writerow(data)
                    f.flush()
                if i % 10 == 0:
                    print(f"  {i}/{len(links)} processados")
                time.sleep(0.5)

    print(f"\nConcluido! Dados salvos em {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
