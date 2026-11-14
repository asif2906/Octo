"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Award, Globe, BookOpen, HeartHandshake, Users, Upload, CheckCircle2 } from "lucide-react"
import type {
  CertificationRow,
  LanguageRow,
  PublicationRow,
  ReferenceRow,
  VolunteeringRow,
} from "@/types/database"

interface ExtraSectionsProps {
  userId: string
  initialCertifications?: CertificationRow[]
  initialLanguages?: LanguageRow[]
  initialPublications?: PublicationRow[]
  initialVolunteering?: VolunteeringRow[]
  initialReferences?: ReferenceRow[]
}

export function ProfileExtraSections({
  userId,
  initialCertifications = [],
  initialLanguages = [],
  initialPublications = [],
  initialVolunteering = [],
  initialReferences = [],
}: ExtraSectionsProps) {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const { toast } = useToast()

  // State
  const [certs, setCerts] = React.useState<CertificationRow[]>(initialCertifications)
  const [langs, setLangs] = React.useState<LanguageRow[]>(initialLanguages)
  const [pubs, setPubs] = React.useState<PublicationRow[]>(initialPublications)
  const [vols, setVols] = React.useState<VolunteeringRow[]>(initialVolunteering)
  const [refs, setRefs] = React.useState<ReferenceRow[]>(initialReferences)

  // Forms
  const [showAddCert, setShowAddCert] = React.useState(false)
  const [certForm, setCertForm] = React.useState({ name: "", issuer: "", issue_date: "", credential_url: "" })

  const [showAddLang, setShowAddLang] = React.useState(false)
  const [langForm, setLangForm] = React.useState({ language: "", proficiency: "Professional" })

  const [showAddPub, setShowAddPub] = React.useState(false)
  const [pubForm, setPubForm] = React.useState({ title: "", publisher: "", url: "" })

  const [showAddVol, setShowAddVol] = React.useState(false)
  const [volForm, setVolForm] = React.useState({ organization: "", role: "", description: "" })

  const [showAddRef, setShowAddRef] = React.useState(false)
  const [refForm, setRefForm] = React.useState({ full_name: "", relationship: "", company: "", email: "" })

  // Handlers
  async function addCertification() {
    if (!certForm.name || !certForm.issuer) return
    const { data, error } = await supabase
      .from("certifications")
      .insert({
        user_id: userId,
        name: certForm.name.trim(),
        issuer: certForm.issuer.trim(),
        issue_date: certForm.issue_date.trim() || null,
        credential_url: certForm.credential_url.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setCerts((prev) => [...prev, data as CertificationRow])
      setCertForm({ name: "", issuer: "", issue_date: "", credential_url: "" })
      setShowAddCert(false)
      toast({ title: "Certification added", variant: "success" })
    }
  }

  async function deleteCert(id: string) {
    const { error } = await supabase.from("certifications").delete().eq("id", id)
    if (!error) {
      setCerts((prev) => prev.filter((c) => c.id !== id))
      toast({ title: "Certification removed", variant: "info" })
    }
  }

  async function addLanguage() {
    if (!langForm.language) return
    const { data, error } = await supabase
      .from("languages")
      .insert({
        user_id: userId,
        language: langForm.language.trim(),
        proficiency: langForm.proficiency,
      })
      .select()
      .single()

    if (!error && data) {
      setLangs((prev) => [...prev, data as LanguageRow])
      setLangForm({ language: "", proficiency: "Professional" })
      setShowAddLang(false)
      toast({ title: "Language added", variant: "success" })
    }
  }

  async function deleteLang(id: string) {
    const { error } = await supabase.from("languages").delete().eq("id", id)
    if (!error) {
      setLangs((prev) => prev.filter((l) => l.id !== id))
      toast({ title: "Language removed", variant: "info" })
    }
  }

  async function addPublication() {
    if (!pubForm.title) return
    const { data, error } = await supabase
      .from("publications")
      .insert({
        user_id: userId,
        title: pubForm.title.trim(),
        publisher: pubForm.publisher.trim() || null,
        url: pubForm.url.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setPubs((prev) => [...prev, data as PublicationRow])
      setPubForm({ title: "", publisher: "", url: "" })
      setShowAddPub(false)
      toast({ title: "Publication added", variant: "success" })
    }
  }

  async function deletePub(id: string) {
    const { error } = await supabase.from("publications").delete().eq("id", id)
    if (!error) {
      setPubs((prev) => prev.filter((p) => p.id !== id))
      toast({ title: "Publication removed", variant: "info" })
    }
  }

  async function addVolunteering() {
    if (!volForm.organization || !volForm.role) return
    const { data, error } = await supabase
      .from("volunteering")
      .insert({
        user_id: userId,
        organization: volForm.organization.trim(),
        role: volForm.role.trim(),
        description: volForm.description.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setVols((prev) => [...prev, data as VolunteeringRow])
      setVolForm({ organization: "", role: "", description: "" })
      setShowAddVol(false)
      toast({ title: "Volunteering added", variant: "success" })
    }
  }

  async function deleteVol(id: string) {
    const { error } = await supabase.from("volunteering").delete().eq("id", id)
    if (!error) {
      setVols((prev) => prev.filter((v) => v.id !== id))
      toast({ title: "Volunteering record removed", variant: "info" })
    }
  }

  async function addReference() {
    if (!refForm.full_name) return
    const { data, error } = await supabase
      .from("references")
      .insert({
        user_id: userId,
        full_name: refForm.full_name.trim(),
        relationship: refForm.relationship.trim() || null,
        company: refForm.company.trim() || null,
        email: refForm.email.trim() || null,
      })
      .select()
      .single()

    if (!error && data) {
      setRefs((prev) => [...prev, data as ReferenceRow])
      setRefForm({ full_name: "", relationship: "", company: "", email: "" })
      setShowAddRef(false)
      toast({ title: "Reference added", variant: "success" })
    }
  }

  async function deleteRef(id: string) {
    const { error } = await supabase.from("references").delete().eq("id", id)
    if (!error) {
      setRefs((prev) => prev.filter((r) => r.id !== id))
      toast({ title: "Reference removed", variant: "info" })
    }
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Certifications Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-foreground">Licenses & Certifications</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddCert(!showAddCert)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {showAddCert && (
          <div className="mt-4 p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Certification Name *</Label>
                <Input value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} placeholder="AWS Solutions Architect" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Issuing Organization *</Label>
                <Input value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} placeholder="Amazon Web Services" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Issue Date</Label>
                <Input value={certForm.issue_date} onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} placeholder="2024" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Credential Link</Label>
                <Input value={certForm.credential_url} onChange={(e) => setCertForm({ ...certForm, credential_url: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddCert(false)}>Cancel</Button>
              <Button size="sm" onClick={addCertification}>Save Certification</Button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {certs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No certifications added yet.</p>
          ) : (
            certs.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.issuer} {c.issue_date ? `· ${c.issue_date}` : ""}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300" onClick={() => deleteCert(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Languages Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-foreground">Languages</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddLang(!showAddLang)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {showAddLang && (
          <div className="mt-4 p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Language *</Label>
                <Input value={langForm.language} onChange={(e) => setLangForm({ ...langForm, language: e.target.value })} placeholder="Spanish" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Proficiency</Label>
                <Input value={langForm.proficiency} onChange={(e) => setLangForm({ ...langForm, proficiency: e.target.value })} placeholder="Professional working" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddLang(false)}>Cancel</Button>
              <Button size="sm" onClick={addLanguage}>Save Language</Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {langs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No languages added yet.</p>
          ) : (
            langs.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs">
                <span className="font-medium text-foreground">{l.language}</span>
                <span className="text-muted-foreground">({l.proficiency})</span>
                <button type="button" onClick={() => deleteLang(l.id)} className="text-muted-foreground hover:text-red-400">×</button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Publications Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-foreground">Publications & Articles</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddPub(!showAddPub)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {showAddPub && (
          <div className="mt-4 p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Title *</Label>
                <Input value={pubForm.title} onChange={(e) => setPubForm({ ...pubForm, title: e.target.value })} placeholder="High-throughput systems" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Publisher / Publication</Label>
                <Input value={pubForm.publisher} onChange={(e) => setPubForm({ ...pubForm, publisher: e.target.value })} placeholder="IEEE / Medium" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddPub(false)}>Cancel</Button>
              <Button size="sm" onClick={addPublication}>Save Publication</Button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {pubs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No publications recorded.</p>
          ) : (
            pubs.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.publisher}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300" onClick={() => deletePub(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Volunteering Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-rose-400" />
            <h3 className="font-semibold text-foreground">Volunteering & Community</h3>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddVol(!showAddVol)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {showAddVol && (
          <div className="mt-4 p-4 rounded-lg border border-border/60 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Organization *</Label>
                <Input value={volForm.organization} onChange={(e) => setVolForm({ ...volForm, organization: e.target.value })} placeholder="Open Source Initiative" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Role *</Label>
                <Input value={volForm.role} onChange={(e) => setVolForm({ ...volForm, role: e.target.value })} placeholder="Mentor / Contributor" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddVol(false)}>Cancel</Button>
              <Button size="sm" onClick={addVolunteering}>Save Volunteering</Button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {vols.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No volunteering experience listed.</p>
          ) : (
            vols.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{v.role} — {v.organization}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300" onClick={() => deleteVol(v.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

