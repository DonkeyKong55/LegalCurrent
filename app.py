from flask import Flask, jsonify
import requests
from bs4 import BeautifulSoup
import feedparser

app = Flask(__name__)

# 1. Lawyers Weekly RSS feed
def fetch_lawyers_weekly():
    url = 'https://www.lawyersweekly.com.au/rss'
    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries[:5]:
        articles.append({
            'source': 'Lawyers Weekly',
            'title': entry.title,
            'link': entry.link,
            'published': entry.published,
            'summary': entry.summary
        })
    return articles

# 2. AustLII recent Federal Court judgments
def fetch_austlii_judgments():
    url = 'http://www.austlii.edu.au/cgi-bin/viewdb/au/cases/cth/FCA/'
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')
    judgments = []
    # Judgments are in a <pre> tag with links — parse first 5 links in that block
    pre = soup.find('pre')
    if pre:
        links = pre.find_all('a')[:5]
        for link in links:
            judgments.append({
                'source': 'AustLII',
                'title': link.text.strip(),
                'link': f"http://www.austlii.edu.au{link['href']}"
            })
    return judgments

# 3. Federal Court recent judgments
def fetch_federal_court_judgments():
    url = 'http://www.fedcourt.gov.au/digital-law-library/judgments'
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')
    judgments = []
    # The site uses table rows for cases, adjust selector accordingly
    rows = soup.select('table.judgments-table tbody tr')[:5]
    for row in rows:
        cols = row.find_all('td')
        if len(cols) >= 3:
            title = cols[0].get_text(strip=True)
            date = cols[1].get_text(strip=True)
            link_tag = cols[0].find('a')
            link = link_tag['href'] if link_tag else ''
            if link and link.startswith('/'):
                link = f"http://www.fedcourt.gov.au{link}"
            judgments.append({
                'source': 'Federal Court',
                'title': title,
                'date': date,
                'link': link
            })
    return judgments

# 4. Law Society of NSW recent news
def fetch_lawsociety_news():
    url = 'https://www.lawsociety.com.au/news-amp-events/news'
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')
    news_items = []
    articles = soup.select('.news-article')[:5]
    for article in articles:
        title_tag = article.select_one('h3')
        link_tag = article.select_one('a')
        date_tag = article.select_one('.date')
        if title_tag and link_tag and date_tag:
            news_items.append({
                'source': 'Law Society NSW',
                'title': title_tag.text.strip(),
                'link': link_tag['href'],
                'date': date_tag.text.strip()
            })
    return news_items

@app.route('/api/latest-legal-content')
def latest_legal_content():
    results = []
    results.extend(fetch_lawyers_weekly())
    results.extend(fetch_austlii_judgments())
    results.extend(fetch_federal_court_judgments())
    results.extend(fetch_lawsociety_news())
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
