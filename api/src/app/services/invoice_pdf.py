import io
from calendar import month_name
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.orm import Session, selectinload
from src.app.model.invoice import Invoice, InvoiceStatus


COMPANY_NAME = "ams3ping"


class InvoicePDFService:
    @staticmethod
    def generate_invoice_pdf(db: Session, invoice_id: int) -> bytes:
        invoice = (
            db.query(Invoice)
            .options(
                selectinload(Invoice.tenant),
                selectinload(Invoice.room),
                selectinload(Invoice.payments),
            )
            .filter(Invoice.id == invoice_id)
            .first()
        )

        if not invoice:
            raise ValueError(f"Invoice {invoice_id} not found")

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=0.55 * inch,
            bottomMargin=0.55 * inch,
            leftMargin=0.6 * inch,
            rightMargin=0.6 * inch,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=32,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#111827"),
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            "SubtitleStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#6B7280"),
        )

        section_title_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#111827"),
            spaceAfter=10,
            spaceBefore=10,
        )

        label_style = ParagraphStyle(
            "LabelStyle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=colors.HexColor("#374151"),
        )

        value_style = ParagraphStyle(
            "ValueStyle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=colors.HexColor("#111827"),
        )

        footer_style = ParagraphStyle(
            "FooterStyle",
            parent=styles["Normal"],
            alignment=TA_CENTER,
            fontSize=9,
            textColor=colors.HexColor("#9CA3AF"),
        )

        story = []

        # =========================================================
        # HEADER
        # =========================================================
        header_table = Table(
            [
                [
                    Paragraph(f"<b>{COMPANY_NAME}</b>", title_style),
                    Paragraph(
                        """
                        <para align=right>
                        <font size=22><b>INVOICE</b></font><br/>
                        <font size=10 color="#6B7280">
                        Professional Rental Invoice
                        </font>
                        </para>
                        """,
                        styles["BodyText"],
                    ),
                ]
            ],
            colWidths=[3.5 * inch, 2.5 * inch],
        )

        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )

        story.append(header_table)
        story.append(Spacer(1, 10))

        story.append(
            HRFlowable(
                width="100%",
                thickness=1,
                color=colors.HexColor("#D1D5DB"),
            )
        )

        story.append(Spacer(1, 20))

        # =========================================================
        # INVOICE DETAILS + TENANT INFO
        # =========================================================
        tenant = invoice.tenant
        room = invoice.room

        invoice_details = [
            [
                Paragraph("<b>Invoice #</b>", label_style),
                Paragraph(str(invoice.id), value_style),
            ],
            [
                Paragraph("<b>Invoice Date</b>", label_style),
                Paragraph(
                    invoice.created_at.strftime("%Y-%m-%d")
                    if invoice.created_at
                    else "N/A",
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Due Date</b>", label_style),
                Paragraph(
                    invoice.due_date.strftime("%Y-%m-%d"),
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Billing Period</b>", label_style),
                Paragraph(
                    f"{month_name[invoice.month]} {invoice.year}",
                    value_style,
                ),
            ],
        ]

        tenant_details = [
            [
                Paragraph("<b>Tenant Name</b>", label_style),
                Paragraph(
                    tenant.name if tenant else "N/A",
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Email</b>", label_style),
                Paragraph(
                    tenant.email if tenant else "N/A",
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Phone</b>", label_style),
                Paragraph(
                    tenant.phone
                    if tenant and tenant.phone
                    else "N/A",
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Room</b>", label_style),
                Paragraph(
                    room.name if room else "N/A",
                    value_style,
                ),
            ],
            [
                Paragraph("<b>Check-in</b>", label_style),
                Paragraph(
                    tenant.check_in_date.strftime("%Y-%m-%d")
                    if tenant and tenant.check_in_date
                    else "N/A",
                    value_style,
                ),
            ],
        ]

        left_table = Table(invoice_details, colWidths=[1.5 * inch, 1.6 * inch])
        right_table = Table(tenant_details, colWidths=[1.4 * inch, 1.9 * inch])

        for table in [left_table, right_table]:
            table.setStyle(
                TableStyle(
                    [
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                )
            )

        details_wrapper = Table(
            [
                [
                    [
                        Paragraph("Invoice Details", section_title_style),
                        left_table,
                    ],
                    [
                        Paragraph("Tenant Information", section_title_style),
                        right_table,
                    ],
                ]
            ],
            colWidths=[3.1 * inch, 3.1 * inch],
        )

        details_wrapper.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#F9FAFB")),
                    ("BOX", (0, 0), (0, 0), 0.5, colors.HexColor("#E5E7EB")),
                    ("LEFTPADDING", (0, 0), (0, 0), 14),
                    ("RIGHTPADDING", (0, 0), (0, 0), 14),
                    ("TOPPADDING", (0, 0), (0, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (0, 0), 12),
                ]
            )
        )

        story.append(details_wrapper)
        story.append(Spacer(1, 24))

        # =========================================================
        # PAYMENT SUMMARY
        # =========================================================
        amount_due = float(invoice.amount)
        amount_paid = float(invoice.amount_paid)
        remaining = amount_due - amount_paid

        story.append(Paragraph("Payment Summary", section_title_style))

        summary_data = [
            [
                Paragraph("<b>Description</b>", label_style),
                Paragraph("<b>Amount</b>", label_style),
            ],
            [
                "Monthly Rent",
                f"${amount_due:,.2f}",
            ],
            [
                "Amount Paid",
                f"${amount_paid:,.2f}",
            ],
            [
                "Remaining Balance",
                f"${remaining:,.2f}",
            ],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[4.3 * inch, 1.8 * inch],
        )

        summary_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BACKGROUND", (0, 1), (-1, -2), colors.white),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#F3F4F6")),
                ]
            )
        )

        story.append(summary_table)
        story.append(Spacer(1, 24))

        # =========================================================
        # PAYMENT HISTORY
        # =========================================================
        if invoice.payments:
            story.append(Paragraph("Payment History", section_title_style))

            payment_data = [
                [
                    Paragraph("<b>Date</b>", label_style),
                    Paragraph("<b>Amount</b>", label_style),
                    Paragraph("<b>Status</b>", label_style),
                ]
            ]

            for payment in invoice.payments:
                payment_data.append(
                    [
                        payment.paid_at.strftime("%Y-%m-%d")
                        if payment.paid_at
                        else "N/A",
                        f"${float(payment.amount):,.2f}",
                        payment.status.value.upper()
                        if payment.status
                        else "COMPLETED",
                    ]
                )

            payment_table = Table(
                payment_data,
                colWidths=[2.2 * inch, 1.7 * inch, 2.2 * inch],
            )

            payment_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 10),
                        ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ]
                )
            )

            story.append(payment_table)
            story.append(Spacer(1, 24))

        # =========================================================
        # STATUS
        # =========================================================
        if invoice.status == InvoiceStatus.paid:
            status_color = "#10B981"
            status_bg = "#ECFDF5"
        elif invoice.status == InvoiceStatus.pending:
            status_color = "#F59E0B"
            status_bg = "#FFFBEB"
        else:
            status_color = "#EF4444"
            status_bg = "#FEF2F2"

        status_table = Table(
            [
                [
                    Paragraph(
                        f"""
                        <para align=center>
                        <font color="{status_color}">
                        <b>{invoice.status.value.upper()}</b>
                        </font>
                        </para>
                        """,
                        styles["BodyText"],
                    )
                ]
            ],
            colWidths=[2 * inch],
        )

        status_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(status_bg)),
                    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor(status_color)),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )

        story.append(Paragraph("Invoice Status", section_title_style))
        story.append(status_table)

        if invoice.paid_at:
            story.append(Spacer(1, 10))
            story.append(
                Paragraph(
                    f"Paid on: <b>{invoice.paid_at.strftime('%Y-%m-%d')}</b>",
                    subtitle_style,
                )
            )

        # =========================================================
        # FOOTER
        # =========================================================
        story.append(Spacer(1, 40))

        story.append(
            HRFlowable(
                width="100%",
                thickness=1,
                color=colors.HexColor("#E5E7EB"),
            )
        )

        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                "Thank you for your business!",
                footer_style,
            )
        )

        doc.build(story)

        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def get_filename(invoice: Invoice) -> str:
        return f"invoice_{invoice.year}_{invoice.month:02d}_{invoice.id}.pdf"