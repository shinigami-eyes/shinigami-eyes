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
This extension is focused on anti-trans (including anti-nonbinary) sentiment, of all flavors: radfem/terf, religious, alt-right etc. (although most of the data is about the first group). See below for more details.

## I think a page is labeled incorrectly
Right click its link, `Shinigami Eyes` -> `Mark as (whatever is appropriate)`. Your contribution will help us improve this extension.

## Can I see the list of pages and their labels?
While the data is stored locally on your computer, it's represented as a [bloom filter](https://en.wikipedia.org/wiki/Bloom_filter). It's a data structure that "remembers" whether it contains something or not, but that is unable to explicitely list what it contains.
It's susceptible to false positives, but there should be very few of them.

## Why did you create this extension?
As a transgender person, I got used to be distrustful towards people. While guessing the attitudes of an openly [conservative](https://rationalwiki.org/wiki/Pope_Francis#On_gender.2C_sex_and_sexuality) group or person towards transgender people is easy, this is much more difficult when you deal with communities that tend to be moderately progressive, such as the [feminist](https://rationalwiki.org/wiki/Trans-exclusionary_radical_feminism) community, the [lesbian](https://www.pinknews.co.uk/2018/07/07/anti-trans-group-allowed-to-lead-pride-in-london-march-after-hijack/) community, and women's associations.

The purpose of this extension is to make transgender people feel more confident towards people, groups, and pages they can trust, and to highlight possible interactions with the transphobic ones (when this is not already evident, such as when discussing about common LGBT or feminist goals).

## Instructions on how to label
We try to be conservative when marking a page one way or the other. Do not flag unless you're reasonably confident about your decision.
### Do not mark as anti-trans
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-not-anti-trans.png)
### Do mark as anti-trans
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-anti-trans.png)
### Do not mark as trans-friendly
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-not-trans-friendly.png)
### Do mark as trans-friendly
![Examples](https://raw.githubusercontent.com/shinigami-eyes/shinigami-eyes/master/images/example-trans-friendly.png)
