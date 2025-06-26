"use client"; // Required for useEffect and useRef

import { useEffect, useRef } from "react";
import { BlurScrollEffect_Effect4 } from "@/lib/animations"; // Adjust path if needed
import gsap from "gsap"; // ScrollTrigger is globally registered

export default function PrivacyPolicyPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null); // For parallax background
  const mainElementRef = useRef<HTMLElement>(null); // For main scroll trigger

  useEffect(() => {
    // Existing BlurScrollEffect logic for contentRef
    if (contentRef.current) {
      new BlurScrollEffect_Effect4(contentRef.current);
    }
  }, []);

  useEffect(() => {
    // New Parallax Effect for backgroundRef
    if (backgroundRef.current && mainElementRef.current) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mainElementRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.to(backgroundRef.current, {
        yPercent: -15,
        ease: "none",
      });

      return () => {
        tl.kill(); // Kill the timeline and its ScrollTrigger
      };
    }
  }, []);

  return (
    <div className="relative" style={{ backgroundColor: "#fdf3e1" }}>
      {/* Clipping container for the parallax image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          ref={backgroundRef}
          className="absolute inset-0 z-0 h-[130%] opacity-0"
        ></div>
      </div>

      <main
        ref={mainElementRef}
        className="relative flex min-h-screen text-black pt-24"
      >
        {/* Left Column (Sticky Title) */}
        <div className="relative sticky top-0 z-10 flex h-screen w-[40%] flex-shrink-0 flex-col justify-center p-8 border-r border-gray-300">
          <h1 className="text-xl font-medium tracking-widest lowercase text-black mix-blend-difference">
            privacy policy
          </h1>
        </div>

        {/* Right Column (Scrollable Content) */}
        <div className="relative z-10 flex-grow p-8 bg-[rgba(0,0,0,0.02)] backdrop-blur-md">
          <div
            ref={contentRef}
            className="text-xl lowercase tracking-wider text-black space-y-4 mix-blend-difference"
          >
            <p>last updated: june 20, 2025</p>
            <p>
              june of operates this store and website, including all related
              information, content, features, tools, products and services, in
              order to provide you, the customer, with a curated shopping
              experience (the &quot;services&quot;). june of is powered by
              shopify, which enables us to provide the services to you. this
              privacy policy describes how we collect, use, and disclose your
              personal information when you visit, use, or make a purchase or
              other transaction using the services or otherwise communicate with
              us. if there is a conflict between our terms of service and this
              privacy policy, this privacy policy controls with respect to the
              collection, processing, and disclosure of your personal
              information.
            </p>
            <p>
              please read this privacy policy carefully. by using and accessing
              any of the services, you acknowledge that you have read this
              privacy policy and understand the collection, use, and disclosure
              of your information as described in this privacy policy.
            </p>
            <p>personal information we collect or process</p>
            <p>
              when we use the term &quot;personal information,&quot; we are
              referring to information that identifies or can reasonably be
              linked to you or another person. personal information does not
              include information that is collected anonymously or that has been
              de-identified, so that it cannot identify or be reasonably linked
              to you. we may collect or process the following categories of
              personal information, including inferences drawn from this
              personal information, depending on how you interact with the
              services, where you live, and as permitted or required by
              applicable law:
            </p>
            <p>
              contact details including your name, address, billing address,
              shipping address, phone number, and email address.
            </p>
            <p>
              financial information including credit card, debit card, and
              financial account numbers, payment card information, financial
              account information, transaction details, form of payment, payment
              confirmation and other payment details.
            </p>
            <p>
              account information including your username, password, security
              questions, preferences and settings.
            </p>
            <p>
              transaction information including the items you view, put in your
              cart, add to your wishlist, or purchase, return, exchange or
              cancel and your past transactions.
            </p>
            <p>
              communications with us including the information you include in
              communications with us, for example, when sending a customer
              support inquiry.
            </p>
            <p>
              device information including information about your device,
              browser, or network connection, your ip address, and other unique
              identifiers.
            </p>
            <p>
              usage information including information regarding your interaction
              with the services, including how and when you interact with or
              navigate the services.
            </p>
            <p>personal information sources</p>
            <p>
              we may collect personal information from the following sources:
            </p>
            <p>
              directly from you including when you create an account, visit or
              use the services, communicate with us, or otherwise provide us
              with your personal information;
            </p>
            <p>
              automatically through the services including from your device when
              you use our products or services or visit our websites, and
              through the use of cookies and similar technologies;
            </p>
            <p>
              from our service providers including when we engage them to enable
              certain technology and when they collect or process your personal
              information on our behalf;
            </p>
            <p>from our partners or other third parties.</p>
            <p>how we use your personal information</p>
            <p>
              depending on how you interact with us or which of the services you
              use, we may use personal information for the following purposes:
            </p>
            <p>
              provide, tailor, and improve the services. we use your personal
              information to provide you with the services, including to perform
              our contract with you, to process your payments, to fulfill your
              orders, to remember your preferences and items you are interested
              in, to send notifications to you related to your account, to
              process purchases, returns, exchanges or other transactions, to
              create, maintain and otherwise manage your account, to arrange for
              shipping, to facilitate any returns and exchanges, to enable you
              to post reviews, and to create a customized shopping experience
              for you, such as recommending products related to your purchases.
              this may include using your personal information to better tailor
              and improve the services.
            </p>
            <p>
              marketing and advertising. we use your personal information for
              marketing and promotional purposes, such as to send marketing,
              advertising and promotional communications by email, text message
              or postal mail, and to show you online advertisements for products
              or services on the services or other websites, including based on
              items you previously have purchased or added to your cart and
              other activity on the services.
            </p>
            <p>
              security and fraud prevention. we use your personal information to
              authenticate your account, to provide a secure payment and
              shopping experience, detect, investigate or take action regarding
              possible fraudulent, illegal, unsafe, or malicious activity,
              protect public safety, and to secure our services. if you choose
              to use the services and register an account, you are responsible
              for keeping your account credentials safe. we highly recommend
              that you do not share your username, password or other access
              details with anyone else.
            </p>
            <p>
              communicating with you. we use your personal information to
              provide you with customer support, to be responsive to you, to
              provide effective services to you and to maintain our business
              relationship with you.
            </p>
            <p>
              legal reasons. we use your personal information to comply with
              applicable law or respond to valid legal process, including
              requests from law enforcement or government agencies, to
              investigate or participate in civil discovery, potential or actual
              litigation, or other adversarial legal proceedings, and to enforce
              or investigate potential violations of our terms or policies.
            </p>
            <p>how we disclose personal information</p>
            <p>
              in certain circumstances, we may disclose your personal
              information to third parties for legitimate purposes subject to
              this privacy policy. such circumstances may include:
            </p>
            <p>
              with shopify, vendors and other third parties who perform services
              on our behalf (e.g. it management, payment processing, data
              analytics, customer support, cloud storage, fulfillment and
              shipping).
            </p>
            <p>
              with business and marketing partners to provide marketing services
              and advertise to you. for example, we use shopify to support
              personalized advertising with third-party services based on your
              online activity with different merchants and websites. our
              business and marketing partners will use your information in
              accordance with their own privacy notices. depending on where you
              reside, you may have a right to direct us not to share information
              about you to show you targeted advertisements and marketing based
              on your online activity with different merchants and websites.
            </p>
            <p>
              when you direct, request us or otherwise consent to our disclosure
              of certain information to third parties, such as to ship you
              products or through your use of social media widgets or login
              integrations.
            </p>
            <p>with our affiliates or otherwise within our corporate group.</p>
            <p>
              in connection with a business transaction such as a merger or
              bankruptcy, to comply with any applicable legal obligations
              (including to respond to subpoenas, search warrants and similar
              requests), to enforce any applicable terms of service or policies,
              and to protect or defend the services, our rights, and the rights
              of our users or others.
            </p>
            <p>relationship with shopify</p>
            <p>
              the services are hosted by shopify, which collects and processes
              personal information about your access to and use of the services
              in order to provide and improve the services for you. information
              you submit to the services will be transmitted to and shared with
              shopify as well as third parties that may be located in countries
              other than where you reside, in order to provide and improve the
              services for you. in addition, to help protect, grow, and improve
              our business, we use certain shopify enhanced features that
              incorporate data and information obtained from your interactions
              with our store, along with other merchants and with shopify. to
              provide these enhanced features, shopify may make use of personal
              information collected about your interactions with our store,
              along with other merchants, and with shopify. in these
              circumstances, shopify is responsible for the processing of your
              personal information, including for responding to your requests to
              exercise your rights over use of your personal information for
              these purposes. to learn more about how shopify uses your personal
              information and any rights you may have, you can visit the shopify
              consumer privacy policy. depending on where you live, you may
              exercise certain rights with respect to your personal information
              here shopify privacy portal link.
            </p>
            <p>third party websites and links</p>
            <p>
              the services may provide links to websites or other online
              platforms operated by third parties. if you follow links to sites
              not affiliated or controlled by us, you should review their
              privacy and security policies and other terms and conditions. we
              do not guarantee and are not responsible for the privacy or
              security of such sites, including the accuracy, completeness, or
              reliability of information found on these sites. information you
              provide on public or semi-public venues, including information you
              share on third-party social networking platforms may also be
              viewable by other users of the services and/or users of those
              third-party platforms without limitation as to its use by us or by
              a third party. our inclusion of such links does not, by itself,
              imply any endorsement of the content on such platforms or of their
              owners or operators, except as disclosed on the services.
            </p>
            <p>children&apos;s data</p>
            <p>
              the services are not intended to be used by children, and we do
              not knowingly collect any personal information about children
              under the age of majority in your jurisdiction. if you are the
              parent or guardian of a child who has provided us with their
              personal information, you may contact us using the contact details
              set out below to request that it be deleted. as of the effective
              date of this privacy policy, we do not have actual knowledge that
              we &quot;share&quot; or &quot;sell&quot; (as those terms are
              defined in applicable law) personal information of individuals
              under 16 years of age.
            </p>
            <p>security and retention of your information</p>
            <p>
              please be aware that no security measures are perfect or
              impenetrable, and we cannot guarantee &quot;perfect
              security.&quot; in addition, any information you send to us may
              not be secure while in transit. we recommend that you do not use
              unsecure channels to communicate sensitive or confidential
              information to us.
            </p>
            <p>
              how long we retain your personal information depends on different
              factors, such as whether we need the information to maintain your
              account, to provide you with services, comply with legal
              obligations, resolve disputes or enforce other applicable
              contracts and policies.
            </p>
            <p>your rights and choices</p>
            <p>
              depending on where you live, you may have some or all of the
              rights listed below in relation to your personal information.
              however, these rights are not absolute, may apply only in certain
              circumstances and, in certain cases, we may decline your request
              as permitted by law.
            </p>
            <p>
              right to access / know. you may have a right to request access to
              personal information that we hold about you.
            </p>
            <p>
              right to delete. you may have a right to request that we delete
              personal information we maintain about you.
            </p>
            <p>
              right to correct. you may have a right to request that we correct
              inaccurate personal information we maintain about you.
            </p>
            <p>
              right of portability. you may have a right to receive a copy of
              the personal information we hold about you and to request that we
              transfer it to a third party, in certain circumstances and with
              certain exceptions.
            </p>
            <p>
              managing communication preferences. we may send you promotional
              emails, and you may opt out of receiving these at any time by
              using the unsubscribe option displayed in our emails to you. if
              you opt out, we may still send you non-promotional emails, such as
              those about your account or orders that you have made.
            </p>
            <p>
              you may exercise any of these rights where indicated on the
              services or by contacting us using the contact details provided
              below. to learn more about how shopify uses your personal
              information and any rights you may have, including rights related
              to data processed by shopify, you can visit
              https://privacy.shopify.com/en.
            </p>
            <p>
              we will not discriminate against you for exercising any of these
              rights. we may need to verify your identity before we can process
              your requests, as permitted or required under applicable law. in
              accordance with applicable laws, you may designate an authorized
              agent to make requests on your behalf to exercise your rights.
              before accepting such a request from an agent, we will require
              that the agent provide proof you have authorized them to act on
              your behalf, and we may need you to verify your identity directly
              with us. we will respond to your request in a timely manner as
              required under applicable law.
            </p>
            <p>complaints</p>
            <p>
              if you have complaints about how we process your personal
              information, please contact us using the contact details provided
              below. depending on where you live, you may have the right to
              appeal our decision by contacting us using the contact details set
              out below, or lodge your complaint with your local data protection
              authority.
            </p>
            <p>international transfers</p>
            <p>
              please note that we may transfer, store and process your personal
              information outside the country you live in.
            </p>
            <p>
              if we transfer your personal information out of the european
              economic area or the united kingdom, we will rely on recognized
              transfer mechanisms like the european commission&apos;s standard
              contractual clauses, or any equivalent contracts issued by the
              relevant competent authority of the uk, as relevant, unless the
              data transfer is to a country that has been determined to provide
              an adequate level of protection.
            </p>
            <p>changes to this privacy policy</p>
            <p>
              we may update this privacy policy from time to time, including to
              reflect changes to our practices or for other operational, legal,
              or regulatory reasons. we will post the revised privacy policy on
              this website, update the &quot;last updated&quot; date and provide
              notice as required by applicable law.
            </p>
            <p>contact</p>
            <p>
              should you have any questions about our privacy practices or this
              privacy policy, or if you would like to exercise any of the rights
              available to you, please call or email us at office@juneof.com or
              contact us at sasthamangalam, warriam, p-108, thiruvananthapuram,
              kl, 695010, in
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
