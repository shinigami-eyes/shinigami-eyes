# Shinigami Eyes

A Chrome/Firefox addon that highlights transphobic/anti-LGBT and trans-friendly subreddits/users/facebook pages/groups with different colors.

* [Shinigami Eyes for Chrome](https://chrome.google.com/webstore/detail/ijcpiojgefnkmcadacmacogglhjdjphj/)
* [Shinigami Eyes for Firefox](https://addons.mozilla.org/en-US/firefox/addon/shinigami-eyes/)

![Screenshot](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/preview.png)

# FAQ
## How does it work?
Whenever you visit Facebook, YouTube, Twitter or Reddit, this extension will color trans-friendly (green) and anti-trans (red) users/pages with different colors.

## How does it know how to color each page?
The initial version has been created through a mix of manual labeling and machine learning. Users can now also contribute with their own labels.

## Does it submit the list of pages that appear on my screen?
No, the check is done offline, on your computer.

## Which criteria is used to determine the label?
This extension is focused on anti-trans (including anti-nonbinary) sentiment, of all flavors: [radfem/terf](https://rationalwiki.org/wiki/Trans-exclusionary_radical_feminism), [religious](https://rationalwiki.org/wiki/Gender_ideology), [alt-right](https://rationalwiki.org/wiki/Alt-right) etc. (although most of the data is about the first group). See below for more details.

## I think a page is labeled incorrectly
Right click its link, `Shinigami Eyes` -> `Mark as (whatever is appropriate)`. Your contribution will help us improve this extension.

## Can I see the list of pages and their labels?
While the data is stored locally on your computer, it's represented as a [bloom filter](https://en.wikipedia.org/wiki/Bloom_filter). It's a data structure that "remembers" whether it contains something or not, but that is unable to explicitely list what it contains.
It's susceptible to false positives, but there should be very few of them.

## Why did you create this extension?
As a transgender person, I got used to be distrustful towards people. While guessing the attitudes of an openly [conservative](https://rationalwiki.org/wiki/Pope_Francis#On_gender.2C_sex_and_sexuality) group or person towards transgender people is easy, this is much more difficult when you deal with communities that tend to be moderately progressive or with intersectional interests, such as the [feminist](https://rationalwiki.org/wiki/Trans-exclusionary_radical_feminism) community, the [lesbian](https://www.pinknews.co.uk/2018/07/07/anti-trans-group-allowed-to-lead-pride-in-london-march-after-hijack/) community, women's associations and the [atheist](https://the-orbit.net/zinniajones/2014/05/atheist-transphobia-superstition-over-science/) community.

The purpose of this extension is to make transgender people feel more confident towards people, groups, and pages they can trust, and to highlight possible interactions with the transphobic ones (when this is not already evident, such as when discussing about common LGBT or feminist goals).

## Instructions on how to label
We try to be conservative when marking a page one way or the other. Do not flag unless you're reasonably confident about your decision.
### Not enough to mark as anti-trans
Being a conservative, a [SWERF](https://rationalwiki.org/wiki/Trans-exclusionary_radical_feminism#Sex_worker-exclusionary_radical_feminism), a bad or mediocre ally, [ace](https://rationalwiki.org/wiki/Asexuality)-phobic, supporting "free speech" and "both sides".
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-not-anti-trans.png)
### Mark as anti-trans
"Protecting womyn's spaces", alt-right transphobia, strong [transmedicalism](https://rationalwiki.org/wiki/Transgender_glossary#Truscum) and [enby](https://rationalwiki.org/wiki/Non-binary_gender)-phobia.
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-anti-trans.png)
### Not enough to mark as trans-friendly
Being transgender, having some decent minimum standard like "hurting people = bad", or supporting the overall LGBT community.
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-not-trans-friendly.png)
### Mark as trans-friendly
Openly supporting the transgender community or calling out transphobia.
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-trans-friendly.png)
