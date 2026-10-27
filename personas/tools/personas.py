import html, sys
from pathlib import Path
OUT=Path(sys.argv[1])/'personas'
NW='<span class="visually-hidden"> (opens in a new window)</span>'
APR='https://megedistrict.gov.in/directApply.do?serviceId=1287'
def c(href,title,text,tag=None,ext=False):
    return (href,title,text,tag,ext)
P=[
 ('employee','government_emp.png','Government Employee','Government Employees','Service rules, notifications, forms and property returns for State Government employees.',[
   ('Service rules and orders',[c('../rules.html','Rules, Orders and Circulars','Service rules, conduct and discipline rules, reservation roster'),
                                c('../Rules/Handbook on Disciplinary Proceedings.pdf','Handbook on Disciplinary Proceedings, 2019 <span class="file-type">(PDF, 48 MB)</span>','Reference for disciplinary cases','PDF',True)]),
   ('Notifications',[c('../notifications.html','Notifications','Latest notifications of the Department'),
                     c('../notifications-a.html','Notifications archive','Older notifications, postings and transfers')]),
   ('Property returns and forms',[c(APR,'File your Annual Property Return','Online through the e-District portal','External website',True),
                                  c('../forms.html','Forms','Pension forms and other forms')])]),
 ('officer','policy_maker.png','IAS or MCS Officer','IAS and MCS Officers','Officer lists, postings, property returns and pension forms for IAS and MCS officers.',[
   ('Officer lists',[c('../ias-list.html','IAS List','IAS officers and their present posts'),
                     c('../mcs-list.html','MCS List','Meghalaya Civil Service officers')]),
   ('Property returns',[c('../ipr.html','Immovable Property Returns (IPR)','IPR filed by IAS, IPS and IFS officers'),
                        c('../ipr-mcs.html','Annual Property Returns – MCS','APR filed by MCS officers'),
                        c(APR,'File your Annual Property Return','Online through the e-District portal','External website',True)]),
   ('Pension',[c('../forms-ias.html','IAS pension forms','Forms for retiring IAS officers'),
               c('../forms-mcs.html','MCS pension forms','Forms for retiring MCS officers')])]),
 ('jobseeker','student.png','Job Seeker','Job Seekers','Recruitment rules, District Selection Committee examinations and age limits.',[
   ('District Selection Committees',[c('../notifications/2026/DSC Exam sequence.pdf','DSC examinations – sequence thereof <span class="file-type">(PDF, 3 MB)</span>','Order of the DSC examinations','PDF',True),
                                     c('../notifications/2026/Revised Syllabus of Qualifying Paper on Local Language.pdf','Local Language qualifying paper syllabus <span class="file-type">(PDF, 3 MB)</span>','Syllabus for all DSCs','PDF',True)]),
   ('Age limits and recruitment',[c('../notifications/2024/AgeRelaxation.pdf','Increase in upper age limit <span class="file-type">(PDF, 234 KB)</span>','For entry into Government service','PDF',True),
                                  c('../notifications/2024/PER-38-2021-91dtd1052024.pdf','Minimum and maximum age limits <span class="file-type">(PDF, 1.45 MB)</span>','For recruitment in certain Departments','PDF',True),
                                  c('../Rules/TimeBoundRecruitementSOP.pdf','Time-bound recruitment SOP <span class="file-type">(PDF, 679 KB)</span>','From vacancy to appointment','PDF',True)]),
   ('Public Service Commission',[c('https://mpsc.nic.in/','Meghalaya Public Service Commission','Examinations and recruitment to State services','External website',True)])]),
 ('pensioner','pensioner.png','Pensioner','Pensioners','Pension forms and pension orders for retired IAS, MCS and MSS officers.',[
   ('Pension forms',[c('../forms-ias.html','IAS pension forms','Application, family details and other forms'),
                     c('../forms-mcs.html','MCS pension forms','Forms for MCS officers'),
                     c('../forms-mss.html','MSS and Steno pension forms','Forms for MSS and Stenographers')]),
   ('Orders',[c('../notifications/2024/AdhocPensionaryBenefits.pdf','Pensionary benefits for regularised adhoc employees <span class="file-type">(PDF, 394 KB)</span>','Extension of pensionary benefits','PDF',True)])]),
 ('citizen','citizen.png','Citizen','Citizens','Information, grievances, property return status and ways to contact the Department.',[
   ('Information and grievances',[c('../rti.html','Right to Information','Public Information Officers and how to apply'),
                                  c('../public-grievance.html','State Public Grievance Redressal','How to register a grievance'),
                                  c('tel:1971','CM Connect – Grievances','Call toll-free 1971 or 1800-3456-851, or WhatsApp 94363 94363','Helpline')]),
   ('Transparency',[c('../ipr.html','Property return status','Returns filed by officers'),
                    c('../who.html','Who is Who','Officers of the Department')]),
   ('Contact and help',[c('../contact-us.html','Contact Us','Address and Web Information Manager'),
                        c('../help.html','Help','Opening files and using the accessibility controls')])]),
]
tmpl=(OUT/'citizen.html').read_text(encoding='utf-8') if (OUT/'citizen.html').exists() else None
TOP='''<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>For {plural} | Personnel &amp; Administrative Reforms Department, Government of Meghalaya</title>
      <meta name="description" content="{intro}">
      <link rel="canonical" href="https://personnel.meghalaya.gov.in/personas/{pid}.html">

      <link href="../../assets/css/boostrap.min.css" rel="stylesheet">
      <link href="../../assets/css/style.css" rel="stylesheet">
      <link href="../../assets/css/theme.css" rel="stylesheet">
      <link href="../../assets/css/footer.css" rel="stylesheet">
      <link href="../../assets/css/personas.css" rel="stylesheet">
      <link href="../assets/css/accessibility-style.css" rel="stylesheet">
      <link href="../assets/css/inner-page.css" rel="stylesheet">
      <link href="../assets/css/persona-page.css" rel="stylesheet">
   </head>

   <body>
      <!-- Header -->
      <div id="header" data-include="../components/header.html"></div>

      <!-- Banner: page title and breadcrumb -->
      <div class="banner">
        <div class="banner_inner">
          <div class="banner_content">
            <div class="banner_logo">
              <p class="fw-bold fs-4">For {plural}</p>
            </div>
            <nav aria-label="Breadcrumb">
              <ol class="breadcrumb-trail">
                <li><a href="../index.html">Home</a></li><li><a href="../index.html#services-for-you">Services for You</a></li><li><span aria-current="page">For {plural}</span></li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <main id="main-content" tabindex="-1">
         <section class="persona-page">
            <div class="container">

               <div class="ps-intro">
                  <img class="ps-intro-img" src="../assets/images/personas/{img}" alt="" width="400" height="400">
                  <div>
                     <p class="ps-kicker">I am a</p>
                     <h1 class="ps-title">{name}</h1>
                     <p class="ps-intro-text">{intro}</p>
                  </div>
               </div>
'''
END='''
            </div>
         </section>
      </main>

      <!-- Footer -->
      <div data-include="../components/footer.html"></div>

      <script src="../assets/js/boostrap.bundle.min.js"></script>
      <script src="../assets/js/jquery.min.js"></script>
      <script src="../assets/js/components.js"></script>
      <script src="../assets/js/menu.js"></script>
      <script src="../assets/js/navbar_scroll.js"></script>
      <script src="../assets/js/accessibility.js"></script>
      <script src="../assets/js/weights.js"></script>
   </body>
</html>
'''
for pid,img,name,plural,intro,groups in P:
    out=TOP.format(pid=pid,img=img,name=name,plural=plural,intro=intro)
    for gi,(gt,cards) in enumerate(groups,1):
        out+=f'''
               <section class="ps-group" aria-labelledby="g-{gi}">
                  <h2 class="ps-group-title" id="g-{gi}">{gt}</h2>
                  <ul class="ps-cards">'''
        for href,title,text,tag,ext in cards:
            a=' target="_blank" rel="noopener noreferrer"' if ext else ''
            hid=NW if ext else ('<span class="visually-hidden">: call toll-free 1971</span>' if href.startswith('tel:') else '')
            out+=f'''
                     <li class="ps-card">
                        <h3 class="ps-card-title h5"><a href="{href}"{a}>{title}{hid}</a></h3>
                        <p class="ps-card-text">{text}</p>'''+(f'\n                        <span class="ps-tag">{tag}</span>' if tag else '')+'''
                     </li>'''
        out+='''
                  </ul>
               </section>'''
    others=''.join(f'''
                  <li><a class="ps-other" href="{p}.html"><img src="../assets/images/personas/{i}" alt="" width="72" height="72"><span>{n}</span></a></li>''' for p,i,n,*_ in P if p!=pid)
    out+=f'''

               <nav class="ps-others" aria-labelledby="others-heading">
                  <h2 class="ps-group-title" id="others-heading">Other services for you</h2>
                  <ul>{others}
                  </ul>
               </nav>
'''+END
    (OUT/f'{pid}.html').write_text(out,encoding='utf-8')
print('personas written:',[p[0] for p in P])
