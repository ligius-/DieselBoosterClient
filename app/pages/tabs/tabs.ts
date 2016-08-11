import {Component, ViewChild} from "@angular/core";
import {HomePage} from "../home/home";
import {AboutPage} from "../about/about";
import {TuningPage} from "../tuning/tuning";
import {BasicPage} from "../basic/basic";
import {Tabs} from "ionic-angular";

@Component({
  templateUrl: 'build/pages/tabs/tabs.html'
})
export class TabsPage {

  private availableTabs: any = [];
  @ViewChild('tabsRef') tabsRef: Tabs;
  static INSTANCE: TabsPage;

  constructor() {
    TabsPage.INSTANCE = this;
    this.availableTabs.push({tab: HomePage, icon: 'home', title: 'Home', idx: 'home'});
    this.availableTabs.push({tab: BasicPage, icon: 'speedometer', title: 'Adjust', idx: 'basic'});
    // this.availableTabs.push({tab: TuningPage, icon: 'flask', title: 'Advanced', idx: 'tuning'});
    this.availableTabs.push({tab: AboutPage, icon: 'information-circle', title: 'About', idx: 'about'});
  }

  static selectTab(idx: string) {
    let arr = TabsPage.INSTANCE.availableTabs;
    let foundTab = arr.find((item: any) => item.idx === idx);
    TabsPage.INSTANCE.tabsRef.select(arr.indexOf(foundTab));
  }
}
